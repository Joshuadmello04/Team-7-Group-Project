package com.example.demo.service;

import com.example.demo.model.Order;
import com.example.demo.model.Order.OrderStatus;
import com.example.demo.model.Order.OrderType;
import com.example.demo.model.Portfolio;
import com.example.demo.model.Transaction;
import com.example.demo.model.Wallet;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.PortfolioRepository;
import com.example.demo.repository.TransactionRepository;
import com.example.demo.repository.WalletRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired private OrderRepository       orderRepo;
    @Autowired private WalletRepository      walletRepo;
    @Autowired private PortfolioRepository   portfolioRepo;
    @Autowired private TransactionRepository transactionRepo;

    // ── Place Limit Buy ───────────────────────────────────────────────────────
    public Order placeLimitBuy(String username, String companyName,
                               double targetPrice, int quantity, int expiresInHours) {
        if (quantity <= 0)    throw new RuntimeException("Quantity must be positive");
        if (targetPrice <= 0) throw new RuntimeException("Target price must be positive");
        // ✅ removed: if (expiresInHours <= 0) throw — 0 means never expires

        Order order = new Order();
        order.setUsername(username);
        order.setCompanyName(companyName);
        order.setType(OrderType.LIMIT_BUY);
        order.setStatus(OrderStatus.PENDING);
        order.setTargetPrice(targetPrice);
        order.setQuantity(quantity);
        order.setFilledQuantity(0);
        order.setCreatedAt(LocalDateTime.now());
        // ✅ null = never expires
        order.setExpiresAt(expiresInHours > 0
                ? LocalDateTime.now().plusHours(expiresInHours)
                : null);
        order.setNote("Waiting for price ≤ ₹" + String.format("%.2f", targetPrice));
        return orderRepo.save(order);
    }

    // ── Place Stop Loss ───────────────────────────────────────────────────────
    public Order placeStopLoss(String username, String companyName,
                               double targetPrice, int quantity, int expiresInHours) {
        if (quantity <= 0)    throw new RuntimeException("Quantity must be positive");
        if (targetPrice <= 0) throw new RuntimeException("Target price must be positive");

        Portfolio holding = portfolioRepo
                .findByUsernameAndCompanyName(username, companyName)
                .orElseThrow(() -> new RuntimeException("You don't own shares of " + companyName));

        if (holding.getQuantity() < quantity)
            throw new RuntimeException("Insufficient shares. You own "
                    + holding.getQuantity() + " but tried to set stop loss for " + quantity);

        Order order = new Order();
        order.setUsername(username);
        order.setCompanyName(companyName);
        order.setType(OrderType.STOP_LOSS);
        order.setStatus(OrderStatus.PENDING);
        order.setTargetPrice(targetPrice);
        order.setQuantity(quantity);
        order.setFilledQuantity(0);
        order.setCreatedAt(LocalDateTime.now());
        // ✅ stop loss: 0 = never expires
        order.setExpiresAt(expiresInHours > 0
                ? LocalDateTime.now().plusHours(expiresInHours)
                : null);
        order.setNote("Sell if price ≤ ₹" + String.format("%.2f", targetPrice));
        return orderRepo.save(order);
    }

    // ── Execute Order (called by exchange-service) ────────────────────────────
    @Transactional
    public Order executeOrder(Long orderId, double currentPrice) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING) return order;

        // ✅ null-safe expiry check
        if (order.getExpiresAt() != null
                && LocalDateTime.now().isAfter(order.getExpiresAt())) {
            return expireOrder(orderId);
        }

        return order.getType() == OrderType.LIMIT_BUY
                ? executeLimitBuy(order, currentPrice)
                : executeStopLoss(order, currentPrice);
    }

    // ── Expire Order ──────────────────────────────────────────────────────────
    @Transactional
    public Order expireOrder(Long orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        if (order.getStatus() != OrderStatus.PENDING) return order;
        order.setStatus(OrderStatus.EXPIRED);
        order.setNote("Order expired without execution");
        return orderRepo.save(order);
    }

    // ── Cancel Order ──────────────────────────────────────────────────────────
    public Order cancelOrder(Long orderId, String username) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUsername().equals(username))
            throw new RuntimeException("Unauthorized");
        if (order.getStatus() != OrderStatus.PENDING)
            throw new RuntimeException("Only PENDING orders can be cancelled");
        order.setStatus(OrderStatus.CANCELLED);
        order.setNote("Cancelled by user");
        return orderRepo.save(order);
    }

    // ── Get Orders ────────────────────────────────────────────────────────────
    public List<Order> getUserOrders(String username) {
        return orderRepo.findByUsernameOrderByCreatedAtDesc(username);
    }

    public List<Order> getPendingOrders() {
        return orderRepo.findByStatus(OrderStatus.PENDING);
    }

    // ── Private: execute limit buy ────────────────────────────────────────────
    private Order executeLimitBuy(Order order, double currentPrice) {
        Wallet wallet = walletRepo.findById(order.getUsername())
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        int maxAffordable = (int) Math.floor(wallet.getBalance() / currentPrice);

        if (maxAffordable == 0) {
            order.setStatus(OrderStatus.REJECTED);
            order.setNote("Rejected: insufficient wallet balance at execution time");
            return orderRepo.save(order);
        }

        int    fillQty = Math.min(order.getQuantity(), maxAffordable);
        double total   = currentPrice * fillQty;

        wallet.setBalance(wallet.getBalance() - total);
        walletRepo.save(wallet);

        Portfolio holding = portfolioRepo
                .findByUsernameAndCompanyName(order.getUsername(), order.getCompanyName())
                .orElse(new Portfolio());

        double totalCost = (holding.getAvgPrice() * holding.getQuantity()) + total;
        int    newQty    = holding.getQuantity() + fillQty;
        holding.setUsername(order.getUsername());
        holding.setCompanyName(order.getCompanyName());
        holding.setQuantity(newQty);
        holding.setAvgPrice(totalCost / newQty);
        portfolioRepo.save(holding);

        saveTransaction(order.getUsername(), order.getCompanyName(), "BUY", fillQty, currentPrice);

        order.setFilledQuantity(fillQty);
        order.setExecutedPrice(currentPrice);   // ✅ added
        order.setExecutedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.EXECUTED);
        order.setNote(fillQty < order.getQuantity()
                ? "Partial fill: " + fillQty + "/" + order.getQuantity()
                  + " shares at ₹" + String.format("%.2f", currentPrice)
                : "Filled: " + fillQty + " shares at ₹" + String.format("%.2f", currentPrice));

        return orderRepo.save(order);
    }

    // ── Private: execute stop loss ────────────────────────────────────────────
    private Order executeStopLoss(Order order, double currentPrice) {
        Portfolio holding = portfolioRepo
                .findByUsernameAndCompanyName(order.getUsername(), order.getCompanyName())
                .orElse(null);

        if (holding == null || holding.getQuantity() == 0) {
            order.setStatus(OrderStatus.REJECTED);
            order.setNote("Rejected: no shares owned at execution time");
            return orderRepo.save(order);
        }

        int    sellQty = Math.min(order.getQuantity(), holding.getQuantity());
        double total   = currentPrice * sellQty;

        Wallet wallet = walletRepo.findById(order.getUsername())
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setBalance(wallet.getBalance() + total);
        walletRepo.save(wallet);

        int remaining = holding.getQuantity() - sellQty;
        if (remaining == 0) portfolioRepo.delete(holding);
        else { holding.setQuantity(remaining); portfolioRepo.save(holding); }

        saveTransaction(order.getUsername(), order.getCompanyName(), "SELL", sellQty, currentPrice);

        order.setFilledQuantity(sellQty);
        order.setExecutedPrice(currentPrice);   // ✅ added
        order.setExecutedAt(LocalDateTime.now());
        order.setStatus(OrderStatus.EXECUTED);
        order.setNote("Stop loss triggered: sold " + sellQty
                + " shares at ₹" + String.format("%.2f", currentPrice));

        return orderRepo.save(order);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private void saveTransaction(String username, String companyName,
                                 String type, int qty, double price) {
        Transaction t = new Transaction();
        t.setUsername(username);
        t.setCompanyName(companyName);
        t.setType(type);
        t.setQuantity(qty);
        t.setPrice(price);
        t.setTotal(price * qty);
        t.setTimestamp(LocalDateTime.now().toString());
        transactionRepo.save(t);
    }
}
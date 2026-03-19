package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.TradeRequest;
import com.example.demo.model.Order;
import com.example.demo.model.Portfolio;
import com.example.demo.model.Transaction;
import com.example.demo.model.Wallet;
import com.example.demo.service.OrderService;
import com.example.demo.service.TradeService;

@RestController
@RequestMapping("/trade")
public class TradeController {

    @Autowired
    private TradeService tradeService;

    @Autowired
    private OrderService orderService;

    // ── Trade ─────────────────────────────────────────────────────────────────

    @PostMapping("/buy")
    public String buy(@RequestBody TradeRequest request) {
        return tradeService.buy(request);
    }

    @PostMapping("/sell")
    public String sell(@RequestBody TradeRequest request) {
        return tradeService.sell(request);
    }

    // ── Portfolio ─────────────────────────────────────────────────────────────

    @GetMapping("/portfolio")
    public List<Portfolio> portfolio(@RequestParam String username) {
        return tradeService.getPortfolio(username);
    }

    @GetMapping("/transactions")
    public List<Transaction> transactions(@RequestParam String username) {
        return tradeService.getTransactions(username);
    }

    // ── Wallet ────────────────────────────────────────────────────────────────

    @PostMapping("/wallet/add")
    public Wallet addMoney(@RequestParam String username,
                           @RequestParam double amount) {
        return tradeService.addMoney(username, amount);
    }

    @GetMapping("/wallet")
    public Wallet getWallet(@RequestParam String username) {
        return tradeService.getWallet(username);
    }

    // ── Orders — user-facing ──────────────────────────────────────────────────

    @PostMapping("/orders/limit-buy")
    public Order placeLimitBuy(@RequestParam String username,
                               @RequestParam String companyName,
                               @RequestParam double targetPrice,
                               @RequestParam int quantity,
                               @RequestParam(defaultValue = "24") int expiresInHours) {
        return orderService.placeLimitBuy(username, companyName, targetPrice, quantity, expiresInHours);
    }

    @PostMapping("/orders/stop-loss")
    public Order placeStopLoss(@RequestParam String username,
                               @RequestParam String companyName,
                               @RequestParam double targetPrice,
                               @RequestParam int quantity,
                               @RequestParam(defaultValue = "24") int expiresInHours) {
        return orderService.placeStopLoss(username, companyName, targetPrice, quantity, expiresInHours);
    }

    @GetMapping("/orders")
    public List<Order> getOrders(@RequestParam String username) {
        return orderService.getUserOrders(username);
    }

    @DeleteMapping("/orders/{id}")
    public Order cancelOrder(@PathVariable Long id,
                             @RequestParam String username) {
        return orderService.cancelOrder(id, username);
    }

    // ── Orders — internal (called by exchange-service) ────────────────────────

    @GetMapping("/orders/pending")
    public List<Order> getPendingOrders() {
        return orderService.getPendingOrders();
    }

    @PostMapping("/orders/execute/{id}")
    public Order executeOrder(@PathVariable Long id,
                              @RequestParam double currentPrice) {
        return orderService.executeOrder(id, currentPrice);
    }

    @PostMapping("/orders/expire/{id}")
    public Order expireOrder(@PathVariable Long id) {
        return orderService.expireOrder(id);
    }
}
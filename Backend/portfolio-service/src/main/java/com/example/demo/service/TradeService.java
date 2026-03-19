package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.client.ShareClient;
import com.example.demo.dto.TradeRequest;
import com.example.demo.model.Portfolio;
import com.example.demo.model.Share;
import com.example.demo.model.Transaction;
import com.example.demo.model.Wallet;
import com.example.demo.repository.PortfolioRepository;
import com.example.demo.repository.TransactionRepository;
import com.example.demo.repository.WalletRepository;

@Service
public class TradeService {

    @Autowired private PortfolioRepository   portfolioRepo;
    @Autowired private WalletRepository      walletRepo;
    @Autowired private TransactionRepository transactionRepo;
    @Autowired private ShareClient           shareClient;

    // ── BUY ───────────────────────────────────────────────────────────────────
    public String buy(TradeRequest request) {

        // 1. Fetch share — need full object for volume check
        Share share = getShare(request.getCompanyName());
        double price = share.getPrice();
        double total = price * request.getQuantity();

        // 2. Check available volume
        if (share.getAvailableVolume() < request.getQuantity())
            throw new RuntimeException("Only " + share.getAvailableVolume()
                    + " shares available. Cannot buy " + request.getQuantity());

        // 3. Check and deduct wallet
        Wallet wallet = walletRepo.findById(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Wallet not found. Please add money first."));

        if (wallet.getBalance() < total)
            throw new RuntimeException("Insufficient balance. Need ₹"
                    + String.format("%.2f", total)
                    + " but have ₹" + String.format("%.2f", wallet.getBalance()));

        wallet.setBalance(wallet.getBalance() - total);
        walletRepo.save(wallet);

        // 4. Update or create holding with weighted avg price
        Portfolio p = portfolioRepo
                .findByUsernameAndCompanyName(request.getUsername(), request.getCompanyName())
                .orElse(new Portfolio());

        double totalCost = (p.getAvgPrice() * p.getQuantity()) + total;
        int    newQty    = p.getQuantity() + request.getQuantity();
        p.setUsername(request.getUsername());
        p.setCompanyName(request.getCompanyName());
        p.setQuantity(newQty);
        p.setAvgPrice(totalCost / newQty);
        portfolioRepo.save(p);

        // 5. Deduct available volume in company-service
        try {
            shareClient.updateVolume(share.getId(), -request.getQuantity());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to update volume for buy: " + e.getMessage());
        }

        // 6. Save transaction
        saveTxn(request, price, "BUY");

        return "Bought " + request.getQuantity() + " shares of "
                + request.getCompanyName() + " at ₹" + String.format("%.2f", price);
    }

    // ── SELL ──────────────────────────────────────────────────────────────────
    public String sell(TradeRequest request) {

        // 1. Check holding exists and has enough shares
        Portfolio p = portfolioRepo
                .findByUsernameAndCompanyName(request.getUsername(), request.getCompanyName())
                .orElseThrow(() -> new RuntimeException("You don't own any shares of " + request.getCompanyName()));

        if (p.getQuantity() < request.getQuantity())
            throw new RuntimeException("Insufficient shares. You own "
                    + p.getQuantity() + " but tried to sell " + request.getQuantity());

        // 2. Fetch current price and credit wallet
        Share share = getShare(request.getCompanyName());
        double price = share.getPrice();
        double total = price * request.getQuantity();

        Wallet wallet = walletRepo.findById(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setBalance(wallet.getBalance() + total);
        walletRepo.save(wallet);

        // 3. Reduce or delete holding
        int remaining = p.getQuantity() - request.getQuantity();
        if (remaining == 0) portfolioRepo.delete(p);
        else { p.setQuantity(remaining); portfolioRepo.save(p); }

        // 4. Restore available volume in company-service
        try {
            shareClient.updateVolume(share.getId(), +request.getQuantity());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to restore volume for sell: " + e.getMessage());
        }

        // 5. Save transaction
        saveTxn(request, price, "SELL");

        return "Sold " + request.getQuantity() + " shares of "
                + request.getCompanyName() + " at ₹" + String.format("%.2f", price);
    }

    // ── Wallet ────────────────────────────────────────────────────────────────
    public Wallet addMoney(String username, double amount) {
        if (amount <= 0) throw new RuntimeException("Amount must be positive");
        Wallet w = walletRepo.findById(username).orElse(new Wallet());
        w.setUsername(username);
        w.setBalance(w.getBalance() + amount);
        return walletRepo.save(w);
    }

    public Wallet getWallet(String username) {
        return walletRepo.findById(username)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    // ── Portfolio & Transactions ──────────────────────────────────────────────
    public List<Portfolio> getPortfolio(String username) {
        return portfolioRepo.findByUsername(username);
    }

    public List<Transaction> getTransactions(String username) {
        return transactionRepo.findByUsername(username);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Share getShare(String companyName) {
        return shareClient.getApprovedShares().stream()
                .filter(s -> s.getCompanyName().equalsIgnoreCase(companyName))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Share not found: " + companyName));
    }

    private void saveTxn(TradeRequest req, double price, String type) {
        Transaction t = new Transaction();
        t.setUsername(req.getUsername());
        t.setCompanyName(req.getCompanyName());
        t.setQuantity(req.getQuantity());
        t.setPrice(price);
        t.setTotal(price * req.getQuantity());
        t.setType(type);
        t.setTimestamp(java.time.LocalDateTime.now().toString());
        transactionRepo.save(t);
    }
}
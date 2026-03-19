package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.demo.client.OrderClient;
import com.example.demo.client.ShareClient;
import com.example.demo.model.Order;
import com.example.demo.model.Share;

@Service
public class PriceUpdater {

    private final ShareClient shareClient;
    private final OrderClient orderClient;
    private final Random random = new Random();

    private final Map<Long, Double> basePrices = new ConcurrentHashMap<>();

    public PriceUpdater(ShareClient shareClient, OrderClient orderClient) {
        this.shareClient = shareClient;
        this.orderClient = orderClient;
    }

    @Scheduled(fixedRate = 5000)
    public void updatePrices() {
        System.out.println("🔥 Updating stock prices...");

        List<Share> shares;
        try {
            shares = shareClient.getAllShares();
            System.out.println("✅ Fetched " + shares.size() + " shares");
        } catch (Exception e) {
            System.err.println("❌ Failed to fetch shares: " + e.getMessage());
            return;
        }

        // ── 1. Update prices + track new prices for order checking ───────────
        // key = companyName (lowercase), value = new price after this tick
        Map<String, Double> updatedPrices = new HashMap<>();

        for (Share s : shares) {
            if (!s.isApproved()) continue;

            double currentPrice = s.getPrice();
            basePrices.putIfAbsent(s.getId(), currentPrice);
            double basePrice = basePrices.get(s.getId());

            double changePercent = (random.nextDouble() * 1.0) - 0.5;
            double reversion     = (basePrice - currentPrice) * 0.005;
            double newPrice      = currentPrice + (currentPrice * changePercent / 100) + reversion;

            newPrice = Math.max(basePrice * 0.10, newPrice);
            newPrice = Math.min(basePrice * 5.00, newPrice);
            newPrice = Math.max(1.0, newPrice);

            try {
                shareClient.updatePrice(s.getId(), newPrice);
                updatedPrices.put(s.getCompanyName().toLowerCase(), newPrice);
                System.out.println("💹 " + s.getCompanyName()
                        + " ₹" + String.format("%.2f", currentPrice)
                        + " → ₹" + String.format("%.2f", newPrice)
                        + " (" + String.format("%+.3f", changePercent) + "%)");
            } catch (Exception e) {
                System.err.println("❌ Price update failed for " + s.getCompanyName());
                // Still track old price for order checking
                updatedPrices.put(s.getCompanyName().toLowerCase(), currentPrice);
            }
        }

        // ── 2. Check pending orders using UPDATED prices ──────────────────────
        List<Order> pendingOrders;
        try {
            pendingOrders = orderClient.getPendingOrders();
            if (!pendingOrders.isEmpty())
                System.out.println("📋 Checking " + pendingOrders.size() + " pending orders...");
        } catch (Exception e) {
            System.err.println("❌ Failed to fetch pending orders: " + e.getMessage());
            return;
        }

        for (Order order : pendingOrders) {

            // Null-safe expiry check
            if (order.getExpiresAt() != null
                    && LocalDateTime.now().isAfter(order.getExpiresAt())) {
                try {
                    orderClient.expireOrder(order.getId());
                    System.out.println("⏰ Order #" + order.getId()
                            + " expired (" + order.getCompanyName() + ")");
                } catch (Exception e) {
                    System.err.println("❌ Failed to expire order #" + order.getId());
                }
                continue;
            }

            // Use updated price from this tick
            Double updatedPrice = updatedPrices.get(order.getCompanyName().toLowerCase());
            if (updatedPrice == null) continue; // stock not found or not approved

            boolean shouldTrigger = false;

            if ("LIMIT_BUY".equals(order.getType())) {
                shouldTrigger = updatedPrice <= order.getTargetPrice();
            } else if ("STOP_LOSS".equals(order.getType())) {
                shouldTrigger = updatedPrice <= order.getTargetPrice();
            }

            if (shouldTrigger) {
                try {
                    Order result = orderClient.executeOrder(order.getId(), updatedPrice);
                    System.out.println("✅ Order #" + order.getId()
                            + " EXECUTED — " + order.getType()
                            + " " + order.getCompanyName()
                            + " @ ₹" + String.format("%.2f", updatedPrice)
                            + " | " + result.getNote());
                } catch (Exception e) {
                    System.err.println("❌ Failed to execute order #"
                            + order.getId() + ": " + e.getMessage());
                }
            }
        }
    }
}
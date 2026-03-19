package com.example.demo.client;

import com.example.demo.model.Order;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "portfolio-service")
public interface OrderClient {

    @GetMapping("/trade/orders/pending")
    List<Order> getPendingOrders();

    @PostMapping("/trade/orders/execute/{id}")
    Order executeOrder(@PathVariable Long id,
                       @RequestParam double currentPrice);

    @PostMapping("/trade/orders/expire/{id}")
    Order expireOrder(@PathVariable Long id);
}
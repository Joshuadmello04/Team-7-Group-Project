package com.example.demo.repository;

import com.example.demo.model.Order;
import com.example.demo.model.Order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUsername(String username);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByUsernameOrderByCreatedAtDesc(String username);
}
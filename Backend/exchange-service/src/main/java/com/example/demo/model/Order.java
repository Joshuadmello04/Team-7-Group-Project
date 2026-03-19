package com.example.demo.model;

import lombok.Data;
import java.time.LocalDateTime;

// Mirror of portfolio-service Order — no @Entity, just for Feign deserialization
@Data
public class Order {
    private Long id;
    private String username;
    private String companyName;
    private String type;            // "LIMIT_BUY" | "STOP_LOSS"
    private String status;          // "PENDING" | "EXECUTED" etc
    private double targetPrice;
    private int quantity;
    private int executedQuantity;
    private double executedPrice;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime executedAt;
    private String note;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getCompanyName() {
		return companyName;
	}
	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public double getTargetPrice() {
		return targetPrice;
	}
	public void setTargetPrice(double targetPrice) {
		this.targetPrice = targetPrice;
	}
	public int getQuantity() {
		return quantity;
	}
	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}
	public int getExecutedQuantity() {
		return executedQuantity;
	}
	public void setExecutedQuantity(int executedQuantity) {
		this.executedQuantity = executedQuantity;
	}
	public double getExecutedPrice() {
		return executedPrice;
	}
	public void setExecutedPrice(double executedPrice) {
		this.executedPrice = executedPrice;
	}
	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}
	public void setExpiresAt(LocalDateTime expiresAt) {
		this.expiresAt = expiresAt;
	}
	public LocalDateTime getExecutedAt() {
		return executedAt;
	}
	public void setExecutedAt(LocalDateTime executedAt) {
		this.executedAt = executedAt;
	}
	public String getNote() {
		return note;
	}
	public void setNote(String note) {
		this.note = note;
	}
    
    
}
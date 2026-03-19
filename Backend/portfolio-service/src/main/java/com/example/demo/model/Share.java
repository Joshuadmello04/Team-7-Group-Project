package com.example.demo.model;

import lombok.Data;

@Data
public class Share {
    private Long id;
    private String companyName;
    private double price;
    private boolean approved;
    private String createdBy;
    private int totalVolume;
    private int availableVolume;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public int getTotalVolume() { return totalVolume; }
    public void setTotalVolume(int totalVolume) { this.totalVolume = totalVolume; }
    public int getAvailableVolume() { return availableVolume; }
    public void setAvailableVolume(int availableVolume) { this.availableVolume = availableVolume; }
}
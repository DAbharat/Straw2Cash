package com.strawmarket.rules.model.dto;

import java.math.BigDecimal;

public class ContractResponse {

    private String contractId;
    private String quoteId;
    private String farmerId;
    private String buyerId;
    private String buyerType;
    private String grade;
    private BigDecimal tonnes;
    private BigDecimal pricePerTonne;
    private BigDecimal netToFarmer;
    private BigDecimal transportCost;
    private BigDecimal platformFee;
    private BigDecimal buyerPays;
    private String deliveryBy;
    private String status;
    private String farmerSignedAt;
    private String buyerSignedAt;
    private String createdAt;
    private String updatedAt;

    // getters + setters for all
    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
    public String getQuoteId() { return quoteId; }
    public void setQuoteId(String quoteId) { this.quoteId = quoteId; }
    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }
    public String getBuyerId() { return buyerId; }
    public void setBuyerId(String buyerId) { this.buyerId = buyerId; }
    public String getBuyerType() { return buyerType; }
    public void setBuyerType(String buyerType) { this.buyerType = buyerType; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public BigDecimal getTonnes() { return tonnes; }
    public void setTonnes(BigDecimal tonnes) { this.tonnes = tonnes; }
    public BigDecimal getPricePerTonne() { return pricePerTonne; }
    public void setPricePerTonne(BigDecimal pricePerTonne) { this.pricePerTonne = pricePerTonne; }
    public BigDecimal getNetToFarmer() { return netToFarmer; }
    public void setNetToFarmer(BigDecimal netToFarmer) { this.netToFarmer = netToFarmer; }
    public BigDecimal getTransportCost() { return transportCost; }
    public void setTransportCost(BigDecimal transportCost) { this.transportCost = transportCost; }
    public BigDecimal getPlatformFee() { return platformFee; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }
    public BigDecimal getBuyerPays() { return buyerPays; }
    public void setBuyerPays(BigDecimal buyerPays) { this.buyerPays = buyerPays; }
    public String getDeliveryBy() { return deliveryBy; }
    public void setDeliveryBy(String deliveryBy) { this.deliveryBy = deliveryBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFarmerSignedAt() { return farmerSignedAt; }
    public void setFarmerSignedAt(String farmerSignedAt) { this.farmerSignedAt = farmerSignedAt; }
    public String getBuyerSignedAt() { return buyerSignedAt; }
    public void setBuyerSignedAt(String buyerSignedAt) { this.buyerSignedAt = buyerSignedAt; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
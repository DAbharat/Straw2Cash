package com.strawmarket.rules.model.entity;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.math.BigDecimal;
import java.time.Instant;

@DynamoDbBean
public class QuoteEntity {

    private String quoteId;
    private String farmerId;
    private String buyerId;
    private String buyerType;
    private String grade;
    private BigDecimal estimatedTonnes;
    private BigDecimal moisturePct;
    private BigDecimal distanceKm;
    private BigDecimal pricePerTonne;
    private BigDecimal netToFarmer;
    private BigDecimal transportCost;
    private BigDecimal platformFee;
    private BigDecimal buyerPays;
    private String createdAt;
    private String validUntil;
    private boolean consumed;   // true once a contract references this quote

    @DynamoDbPartitionKey
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

    public BigDecimal getEstimatedTonnes() { return estimatedTonnes; }
    public void setEstimatedTonnes(BigDecimal estimatedTonnes) { this.estimatedTonnes = estimatedTonnes; }

    public BigDecimal getMoisturePct() { return moisturePct; }
    public void setMoisturePct(BigDecimal moisturePct) { this.moisturePct = moisturePct; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

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

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; }

    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }
}
package com.strawmarket.rules.model.entity;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;

import java.math.BigDecimal;

@DynamoDbBean
public class SettlementEntity {

    private String settlementId;
    private String contractId;
    private String farmerId;
    private String buyerId;
    private BigDecimal totalBuyerPaid;
    private BigDecimal amountToFarmer;
    private BigDecimal amountToTransporter;
    private BigDecimal amountToPlatform;
    private String currency;
    private String status;
    private boolean simulated;
    private String settledAt;

    @DynamoDbPartitionKey
    public String getSettlementId() { return settlementId; }
    public void setSettlementId(String settlementId) { this.settlementId = settlementId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "contractId-index")
    public String getContractId() { return contractId; }

    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }

    public String getBuyerId() { return buyerId; }
    public void setBuyerId(String buyerId) { this.buyerId = buyerId; }

    public BigDecimal getTotalBuyerPaid() { return totalBuyerPaid; }
    public void setTotalBuyerPaid(BigDecimal totalBuyerPaid) { this.totalBuyerPaid = totalBuyerPaid; }

    public BigDecimal getAmountToFarmer() { return amountToFarmer; }
    public void setAmountToFarmer(BigDecimal amountToFarmer) { this.amountToFarmer = amountToFarmer; }

    public BigDecimal getAmountToTransporter() { return amountToTransporter; }
    public void setAmountToTransporter(BigDecimal amountToTransporter) { this.amountToTransporter = amountToTransporter; }

    public BigDecimal getAmountToPlatform() { return amountToPlatform; }
    public void setAmountToPlatform(BigDecimal amountToPlatform) { this.amountToPlatform = amountToPlatform; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isSimulated() { return simulated; }
    public void setSimulated(boolean simulated) { this.simulated = simulated; }

    public String getSettledAt() { return settledAt; }
    public void setSettledAt(String settledAt) { this.settledAt = settledAt; }
}
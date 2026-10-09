package com.strawmarket.rules.model.entity;

import com.strawmarket.rules.model.enums.BuyerType;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.math.BigDecimal;

@DynamoDbBean
public class PriceRule {

    private String buyerType;
    private String version;
    private BigDecimal baseRatePerTonne;      // ₹/tonne before adjustments
    private BigDecimal distanceRatePerKmTonne; // ₹/km/tonne deducted
    private BigDecimal moistureThresholdPct;   // above this, penalty applies
    private BigDecimal moisturePenaltyPerPct;  // ₹/tonne per % above threshold
    private BigDecimal gradeAPremium;          // +ve number (may be 0)
    private BigDecimal gradeBDiscount;         // -ve number
    private BigDecimal gradeCDiscount;         // -ve number

    @DynamoDbPartitionKey
    public String getBuyerType() { return buyerType; }
    public void setBuyerType(String buyerType) { this.buyerType = buyerType; }

    @DynamoDbSortKey
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public BigDecimal getBaseRatePerTonne() { return baseRatePerTonne; }
    public void setBaseRatePerTonne(BigDecimal baseRatePerTonne) { this.baseRatePerTonne = baseRatePerTonne; }

    public BigDecimal getDistanceRatePerKmTonne() { return distanceRatePerKmTonne; }
    public void setDistanceRatePerKmTonne(BigDecimal distanceRatePerKmTonne) { this.distanceRatePerKmTonne = distanceRatePerKmTonne; }

    public BigDecimal getMoistureThresholdPct() { return moistureThresholdPct; }
    public void setMoistureThresholdPct(BigDecimal moistureThresholdPct) { this.moistureThresholdPct = moistureThresholdPct; }

    public BigDecimal getMoisturePenaltyPerPct() { return moisturePenaltyPerPct; }
    public void setMoisturePenaltyPerPct(BigDecimal moisturePenaltyPerPct) { this.moisturePenaltyPerPct = moisturePenaltyPerPct; }

    public BigDecimal getGradeAPremium() { return gradeAPremium; }
    public void setGradeAPremium(BigDecimal gradeAPremium) { this.gradeAPremium = gradeAPremium; }

    public BigDecimal getGradeBDiscount() { return gradeBDiscount; }
    public void setGradeBDiscount(BigDecimal gradeBDiscount) { this.gradeBDiscount = gradeBDiscount; }

    public BigDecimal getGradeCDiscount() { return gradeCDiscount; }
    public void setGradeCDiscount(BigDecimal gradeCDiscount) { this.gradeCDiscount = gradeCDiscount; }
}
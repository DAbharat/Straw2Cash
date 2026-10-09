package com.strawmarket.rules.model.dto;

import com.strawmarket.rules.model.enums.BuyerType;
import com.strawmarket.rules.model.enums.Grade;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class QuoteRequest {

    @NotBlank
    private String farmerId;

    @NotBlank
    private String buyerId;

    @NotNull
    private BuyerType buyerType;

    @NotNull
    @DecimalMin("0.1")
    private BigDecimal estimatedTonnes;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private BigDecimal moisturePct;

    @NotNull
    private Grade grade;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal distanceKm;

    // getters + setters

    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }

    public String getBuyerId() { return buyerId; }
    public void setBuyerId(String buyerId) { this.buyerId = buyerId; }

    public BuyerType getBuyerType() { return buyerType; }
    public void setBuyerType(BuyerType buyerType) { this.buyerType = buyerType; }

    public BigDecimal getEstimatedTonnes() { return estimatedTonnes; }
    public void setEstimatedTonnes(BigDecimal estimatedTonnes) { this.estimatedTonnes = estimatedTonnes; }

    public BigDecimal getMoisturePct() { return moisturePct; }
    public void setMoisturePct(BigDecimal moisturePct) { this.moisturePct = moisturePct; }

    public Grade getGrade() { return grade; }
    public void setGrade(Grade grade) { this.grade = grade; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }
}
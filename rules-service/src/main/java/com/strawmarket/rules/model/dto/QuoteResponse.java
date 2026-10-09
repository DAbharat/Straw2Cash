package com.strawmarket.rules.model.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class QuoteResponse {

    private String quoteId;
    private String currency;
    private BigDecimal pricePerTonne;
    private BigDecimal grossAmount;
    private BigDecimal transportCost;
    private BigDecimal netToFarmer;
    private BigDecimal platformFee;
    private BigDecimal buyerPays;
    private List<BreakdownItem> breakdown;
    private Instant validUntil;

    public static class BreakdownItem {
        private String label;
        private BigDecimal value;

        public BreakdownItem() {}
        public BreakdownItem(String label, BigDecimal value) {
            this.label = label;
            this.value = value;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public BigDecimal getValue() { return value; }
        public void setValue(BigDecimal value) { this.value = value; }
    }

    // getters + setters
    public String getQuoteId() { return quoteId; }
    public void setQuoteId(String quoteId) { this.quoteId = quoteId; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getPricePerTonne() { return pricePerTonne; }
    public void setPricePerTonne(BigDecimal pricePerTonne) { this.pricePerTonne = pricePerTonne; }

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }

    public BigDecimal getTransportCost() { return transportCost; }
    public void setTransportCost(BigDecimal transportCost) { this.transportCost = transportCost; }

    public BigDecimal getNetToFarmer() { return netToFarmer; }
    public void setNetToFarmer(BigDecimal netToFarmer) { this.netToFarmer = netToFarmer; }

    public BigDecimal getPlatformFee() { return platformFee; }
    public void setPlatformFee(BigDecimal platformFee) { this.platformFee = platformFee; }

    public BigDecimal getBuyerPays() { return buyerPays; }
    public void setBuyerPays(BigDecimal buyerPays) { this.buyerPays = buyerPays; }

    public List<BreakdownItem> getBreakdown() { return breakdown; }
    public void setBreakdown(List<BreakdownItem> breakdown) { this.breakdown = breakdown; }

    public Instant getValidUntil() { return validUntil; }
    public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
}
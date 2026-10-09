package com.strawmarket.rules.model.dto;

import java.math.BigDecimal;
import java.util.List;

public class SettlementResponse {

    private String settlementId;
    private String contractId;
    private String farmerId;
    private String buyerId;
    private String currency;
    private String status;
    private boolean simulated;
    private BigDecimal totalBuyerPaid;
    private List<Flow> flows;
    private String settledAt;
    private String disclaimer;

    public static class Flow {
        private String from;
        private String to;
        private BigDecimal amount;

        public Flow() {}
        public Flow(String from, String to, BigDecimal amount) {
            this.from = from;
            this.to = to;
            this.amount = amount;
        }

        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
        public String getTo() { return to; }
        public void setTo(String to) { this.to = to; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    // getters + setters
    public String getSettlementId() { return settlementId; }
    public void setSettlementId(String settlementId) { this.settlementId = settlementId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }

    public String getBuyerId() { return buyerId; }
    public void setBuyerId(String buyerId) { this.buyerId = buyerId; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isSimulated() { return simulated; }
    public void setSimulated(boolean simulated) { this.simulated = simulated; }

    public BigDecimal getTotalBuyerPaid() { return totalBuyerPaid; }
    public void setTotalBuyerPaid(BigDecimal totalBuyerPaid) { this.totalBuyerPaid = totalBuyerPaid; }

    public List<Flow> getFlows() { return flows; }
    public void setFlows(List<Flow> flows) { this.flows = flows; }

    public String getSettledAt() { return settledAt; }
    public void setSettledAt(String settledAt) { this.settledAt = settledAt; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
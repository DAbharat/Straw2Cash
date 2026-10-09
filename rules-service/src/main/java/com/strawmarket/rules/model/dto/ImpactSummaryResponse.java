package com.strawmarket.rules.model.dto;

import java.math.BigDecimal;
import java.util.List;

public class ImpactSummaryResponse {

    private String region;
    private String periodFrom;
    private String periodTo;
    private BigDecimal tonnesDiverted;
    private BigDecimal farmerIncomeINR;
    private BigDecimal co2AvoidedTonnes;
    private int contractsCompleted;
    private List<ContractImpactItem> contractDetails;
    private String methodologyNote;
    private String disclaimer;

    public static class ContractImpactItem {
        private String contractId;
        private String farmerId;
        private String buyerId;
        private BigDecimal tonnes;
        private BigDecimal farmerIncome;
        private BigDecimal co2Avoided;

        public ContractImpactItem() {}
        public ContractImpactItem(String contractId, String farmerId, String buyerId,
                                  BigDecimal tonnes, BigDecimal farmerIncome, BigDecimal co2Avoided) {
            this.contractId = contractId;
            this.farmerId = farmerId;
            this.buyerId = buyerId;
            this.tonnes = tonnes;
            this.farmerIncome = farmerIncome;
            this.co2Avoided = co2Avoided;
        }

        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getFarmerId() { return farmerId; }
        public void setFarmerId(String farmerId) { this.farmerId = farmerId; }
        public String getBuyerId() { return buyerId; }
        public void setBuyerId(String buyerId) { this.buyerId = buyerId; }
        public BigDecimal getTonnes() { return tonnes; }
        public void setTonnes(BigDecimal tonnes) { this.tonnes = tonnes; }
        public BigDecimal getFarmerIncome() { return farmerIncome; }
        public void setFarmerIncome(BigDecimal farmerIncome) { this.farmerIncome = farmerIncome; }
        public BigDecimal getCo2Avoided() { return co2Avoided; }
        public void setCo2Avoided(BigDecimal co2Avoided) { this.co2Avoided = co2Avoided; }
    }

    // getters + setters
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getPeriodFrom() { return periodFrom; }
    public void setPeriodFrom(String periodFrom) { this.periodFrom = periodFrom; }
    public String getPeriodTo() { return periodTo; }
    public void setPeriodTo(String periodTo) { this.periodTo = periodTo; }
    public BigDecimal getTonnesDiverted() { return tonnesDiverted; }
    public void setTonnesDiverted(BigDecimal tonnesDiverted) { this.tonnesDiverted = tonnesDiverted; }
    public BigDecimal getFarmerIncomeINR() { return farmerIncomeINR; }
    public void setFarmerIncomeINR(BigDecimal farmerIncomeINR) { this.farmerIncomeINR = farmerIncomeINR; }
    public BigDecimal getCo2AvoidedTonnes() { return co2AvoidedTonnes; }
    public void setCo2AvoidedTonnes(BigDecimal co2AvoidedTonnes) { this.co2AvoidedTonnes = co2AvoidedTonnes; }
    public int getContractsCompleted() { return contractsCompleted; }
    public void setContractsCompleted(int contractsCompleted) { this.contractsCompleted = contractsCompleted; }
    public List<ContractImpactItem> getContractDetails() { return contractDetails; }
    public void setContractDetails(List<ContractImpactItem> contractDetails) { this.contractDetails = contractDetails; }
    public String getMethodologyNote() { return methodologyNote; }
    public void setMethodologyNote(String methodologyNote) { this.methodologyNote = methodologyNote; }
    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
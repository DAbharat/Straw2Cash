package com.strawmarket.rules.model.dto;

import jakarta.validation.constraints.NotBlank;

public class SettleContractRequest {

    @NotBlank
    private String contractId;

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }
}
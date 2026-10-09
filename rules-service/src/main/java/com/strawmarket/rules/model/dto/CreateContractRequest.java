package com.strawmarket.rules.model.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateContractRequest {

    @NotBlank
    private String quoteId;

    @NotBlank
    private String deliveryBy;   // ISO date, e.g. 2026-10-20

    public String getQuoteId() { return quoteId; }
    public void setQuoteId(String quoteId) { this.quoteId = quoteId; }

    public String getDeliveryBy() { return deliveryBy; }
    public void setDeliveryBy(String deliveryBy) { this.deliveryBy = deliveryBy; }
}
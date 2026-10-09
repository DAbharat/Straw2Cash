package com.strawmarket.rules.model.dto;

import com.strawmarket.rules.model.enums.SignerRole;
import jakarta.validation.constraints.NotNull;

public class SignContractRequest {

    @NotNull
    private SignerRole signer;

    public SignerRole getSigner() { return signer; }
    public void setSigner(SignerRole signer) { this.signer = signer; }
}
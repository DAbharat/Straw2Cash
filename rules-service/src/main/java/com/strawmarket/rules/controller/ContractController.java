package com.strawmarket.rules.controller;

import com.strawmarket.rules.model.dto.ContractResponse;
import com.strawmarket.rules.model.dto.CreateContractRequest;
import com.strawmarket.rules.model.dto.SignContractRequest;
import com.strawmarket.rules.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @PostMapping
    public ResponseEntity<ContractResponse> create(@Valid @RequestBody CreateContractRequest request) {
        return ResponseEntity.ok(contractService.create(request));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<ContractResponse> sign(@PathVariable String id,
                                                 @Valid @RequestBody SignContractRequest request) {
        return ResponseEntity.ok(contractService.sign(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(contractService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ContractResponse>> listByFarmer(@RequestParam String farmerId) {
        return ResponseEntity.ok(contractService.listForFarmer(farmerId));
    }
}
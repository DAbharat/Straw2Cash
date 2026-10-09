package com.strawmarket.rules.controller;

import com.strawmarket.rules.model.dto.SettleContractRequest;
import com.strawmarket.rules.model.dto.SettlementResponse;
import com.strawmarket.rules.service.SettlementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settlements")
public class SettlementController {

    private final SettlementService settlementService;

    public SettlementController(SettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @PostMapping
    public ResponseEntity<SettlementResponse> settle(@Valid @RequestBody SettleContractRequest request) {
        return ResponseEntity.ok(settlementService.settle(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SettlementResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(settlementService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<SettlementResponse>> listByContract(@RequestParam String contractId) {
        return ResponseEntity.ok(settlementService.listByContract(contractId));
    }
}
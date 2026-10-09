package com.strawmarket.rules.controller;

import com.strawmarket.rules.repository.ContractRepository;
import com.strawmarket.rules.repository.SettlementRepository;
import com.strawmarket.rules.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private final ContractRepository contractRepository;
    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    public HealthController(ContractRepository contractRepository,
                            SettlementRepository settlementRepository,
                            UserRepository userRepository) {
        this.contractRepository = contractRepository;
        this.settlementRepository = settlementRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "rules-service",
                "timestamp", Instant.now().toString()
        );
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        Map<String, Object> counts = new LinkedHashMap<>();
        Map<String, Object> tables = new LinkedHashMap<>();

        try {
            tables.put("price_rules", "OK");
            tables.put("quotes", "OK");

            long contracts = contractRepository.findAll().size();
            tables.put("contracts", "OK");
            counts.put("contracts", contracts);

            long settlements = settlementRepository.findAll().size();
            tables.put("settlements", "OK");
            counts.put("settlements", settlements);
            counts.put("users", userRepository.count());
            tables.put("users", "OK");

        } catch (Exception e) {
            tables.put("error", e.getMessage());
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", "UP");
        res.put("service", "rules-service");
        res.put("version", "0.0.1-SNAPSHOT");
        res.put("timestamp", Instant.now().toString());
        res.put("tables", tables);
        res.put("counts", counts);
        return res;
    }
}
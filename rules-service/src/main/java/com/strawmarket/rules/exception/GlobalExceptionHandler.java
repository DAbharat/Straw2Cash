package com.strawmarket.rules.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PricingException.class)
    public ResponseEntity<Map<String, Object>> handlePricing(PricingException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "PRICING_ERROR",
                "message", ex.getMessage(),
                "timestamp", Instant.now().toString()
        ));
    }
    @ExceptionHandler(ContractException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleContract(ContractException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of(
                "error", "CONTRACT_ERROR",
                "message", ex.getMessage(),
                "timestamp", java.time.Instant.now().toString()
        ));
    }
    @ExceptionHandler(SettlementException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleSettlement(SettlementException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of(
                "error", "SETTLEMENT_ERROR",
                "message", ex.getMessage(),
                "timestamp", java.time.Instant.now().toString()
        ));
    }
}
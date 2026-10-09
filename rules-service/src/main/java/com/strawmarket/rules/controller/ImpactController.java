package com.strawmarket.rules.controller;

import com.strawmarket.rules.model.dto.ImpactSummaryResponse;
import com.strawmarket.rules.service.ImpactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/impact")
public class ImpactController {

    private final ImpactService impactService;

    public ImpactController(ImpactService impactService) {
        this.impactService = impactService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ImpactSummaryResponse> summary(
            @RequestParam(required = false) String region,
            @RequestParam(required = false, name = "from") String from,
            @RequestParam(required = false, name = "to") String to) {
        return ResponseEntity.ok(impactService.summary(region, from, to));
    }
}
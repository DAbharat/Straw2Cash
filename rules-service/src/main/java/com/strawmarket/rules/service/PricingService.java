package com.strawmarket.rules.service;

import com.strawmarket.rules.exception.PricingException;
import com.strawmarket.rules.model.dto.QuoteRequest;
import com.strawmarket.rules.model.dto.QuoteResponse;
import com.strawmarket.rules.model.entity.PriceRule;
import com.strawmarket.rules.model.enums.Grade;
import com.strawmarket.rules.repository.PriceRuleRepository;
import com.strawmarket.rules.repository.QuoteRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PricingService {

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.06");  // 6%
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int SCALE = 2;
    private final QuoteRepository quoteRepository;

    private final PriceRuleRepository repository;

    public PricingService(PriceRuleRepository repository, QuoteRepository quoteRepository) {
        this.repository = repository;
        this.quoteRepository = quoteRepository;
    }

    public QuoteResponse quote(QuoteRequest req) {
        PriceRule rule = repository.findActive(req.getBuyerType())
                .orElseThrow(() -> new PricingException(
                        "No active price rule for " + req.getBuyerType()));

        // 1) Start with base rate
        BigDecimal pricePerTonne = rule.getBaseRatePerTonne();

        // 2) Moisture penalty (reduces what farmer is paid)
        BigDecimal moisturePenalty = BigDecimal.ZERO;
        if (req.getMoisturePct().compareTo(rule.getMoistureThresholdPct()) > 0) {
            BigDecimal excess = req.getMoisturePct()
                    .subtract(rule.getMoistureThresholdPct());
            moisturePenalty = excess.multiply(rule.getMoisturePenaltyPerPct())
                    .setScale(SCALE, RoundingMode.HALF_UP);
        }

        // 3) Grade adjustment (premium or discount)
        BigDecimal gradeAdjustment = switch (req.getGrade()) {
            case A -> rule.getGradeAPremium();
            case B -> rule.getGradeBDiscount();
            case C -> rule.getGradeCDiscount();
        };
        if (gradeAdjustment == null) gradeAdjustment = BigDecimal.ZERO;

        // 4) Final price per tonne — only moisture + grade affect what farmer is paid
        pricePerTonne = pricePerTonne
                .subtract(moisturePenalty)
                .add(gradeAdjustment)
                .setScale(SCALE, RoundingMode.HALF_UP);
        if (pricePerTonne.signum() < 0) pricePerTonne = BigDecimal.ZERO;

        // 5) Amounts
        BigDecimal tonnes = req.getEstimatedTonnes();
        BigDecimal gross = pricePerTonne.multiply(tonnes).setScale(SCALE, RoundingMode.HALF_UP);

        // Transport is a SEPARATE cost, paid to the transporter, NOT deducted from farmer
        BigDecimal transportCost = req.getDistanceKm()
                .multiply(rule.getDistanceRatePerKmTonne())
                .multiply(tonnes)
                .setScale(SCALE, RoundingMode.HALF_UP);

        BigDecimal platformFee = gross.multiply(PLATFORM_FEE_RATE).setScale(SCALE, RoundingMode.HALF_UP);
        BigDecimal buyerPays = gross.add(platformFee).add(transportCost).setScale(SCALE, RoundingMode.HALF_UP);

        // 6) Breakdown for UI — shows what happens to the buyer's money
        List<QuoteResponse.BreakdownItem> breakdown = new ArrayList<>();
        breakdown.add(new QuoteResponse.BreakdownItem(
                "Base price (" + req.getBuyerType() + ")",
                rule.getBaseRatePerTonne()));
        breakdown.add(new QuoteResponse.BreakdownItem(
                "Moisture penalty (" + req.getMoisturePct() + "%)",
                moisturePenalty.negate()));
        breakdown.add(new QuoteResponse.BreakdownItem(
                "Grade " + req.getGrade() + " adjustment",
                gradeAdjustment));
        breakdown.add(new QuoteResponse.BreakdownItem(
                "Net price per tonne to farmer",
                pricePerTonne));
        breakdown.add(new QuoteResponse.BreakdownItem(
                "Transport cost (" + req.getDistanceKm() + " km)",
                transportCost));
        breakdown.add(new QuoteResponse.BreakdownItem(
                "Platform fee (6%)",
                platformFee));

        QuoteResponse res = new QuoteResponse();
        res.setQuoteId("Q-" + UUID.randomUUID().toString().substring(0, 8));
        res.setCurrency("INR");
        res.setPricePerTonne(pricePerTonne);
        res.setGrossAmount(gross);
        res.setTransportCost(transportCost);
        res.setNetToFarmer(gross);
        res.setPlatformFee(platformFee);
        res.setBuyerPays(buyerPays);
        res.setBreakdown(breakdown);
        res.setValidUntil(Instant.now().plus(6, ChronoUnit.HOURS));

        // Persist the quote so it can be referenced by contracts
        com.strawmarket.rules.model.entity.QuoteEntity qe = new com.strawmarket.rules.model.entity.QuoteEntity();
        qe.setQuoteId(res.getQuoteId());
        qe.setFarmerId(req.getFarmerId());
        qe.setBuyerId(req.getBuyerId());
        qe.setBuyerType(req.getBuyerType().name());
        qe.setGrade(req.getGrade().name());
        qe.setEstimatedTonnes(req.getEstimatedTonnes());
        qe.setMoisturePct(req.getMoisturePct());
        qe.setDistanceKm(req.getDistanceKm());
        qe.setPricePerTonne(res.getPricePerTonne());
        qe.setNetToFarmer(res.getNetToFarmer());
        qe.setTransportCost(res.getTransportCost());
        qe.setPlatformFee(res.getPlatformFee());
        qe.setBuyerPays(res.getBuyerPays());
        qe.setCreatedAt(java.time.Instant.now().toString());
        qe.setValidUntil(res.getValidUntil().toString());
        qe.setConsumed(false);
        quoteRepository.save(qe);
        return res;
    }
}
package com.strawmarket.rules.service;

import com.strawmarket.rules.model.dto.ImpactSummaryResponse;
import com.strawmarket.rules.model.entity.SettlementEntity;
import com.strawmarket.rules.repository.SettlementRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImpactService {

    // Paddy straw CO2e factor: 1 tonne burned ≈ 1.5 tonnes CO2e
    // Source: common agricultural emission factors (to be cited in final docs).
    private static final BigDecimal CO2_FACTOR = new BigDecimal("1.5");
    private static final int SCALE = 2;

    private final SettlementRepository settlementRepository;

    public ImpactService(SettlementRepository settlementRepository) {
        this.settlementRepository = settlementRepository;
    }

    public ImpactSummaryResponse summary(String region, String from, String to) {
        List<SettlementEntity> all = settlementRepository.findAll();

        BigDecimal tonnesSum = BigDecimal.ZERO;
        BigDecimal incomeSum = BigDecimal.ZERO;
        int completed = 0;
        List<ImpactSummaryResponse.ContractImpactItem> details = new ArrayList<>();

        for (SettlementEntity s : all) {
            BigDecimal tonnes = s.getTonnes() == null ? BigDecimal.ZERO : s.getTonnes();
            BigDecimal income = s.getAmountToFarmer() == null ? BigDecimal.ZERO : s.getAmountToFarmer();
            BigDecimal co2 = tonnes.multiply(CO2_FACTOR).setScale(SCALE, RoundingMode.HALF_UP);

            tonnesSum = tonnesSum.add(tonnes);
            incomeSum = incomeSum.add(income);
            completed++;

            details.add(new ImpactSummaryResponse.ContractImpactItem(
                    s.getContractId(), s.getFarmerId(), s.getBuyerId(),
                    tonnes, income, co2));
        }

        ImpactSummaryResponse res = new ImpactSummaryResponse();
        res.setRegion(region == null || region.isBlank() ? "ALL" : region);
        res.setPeriodFrom(from);
        res.setPeriodTo(to);
        res.setTonnesDiverted(tonnesSum);
        res.setFarmerIncomeINR(incomeSum);
        res.setCo2AvoidedTonnes(tonnesSum.multiply(CO2_FACTOR).setScale(SCALE, RoundingMode.HALF_UP));
        res.setContractsCompleted(completed);
        res.setContractDetails(details);
        res.setMethodologyNote(
                "CO2 avoided calculated using 1.5 t CO2e per tonne of paddy straw burned. " +
                        "Regional filtering and date-range filtering to be added in production. " +
                        "For the hackathon, all settlements are treated as Punjab-region."
        );
        res.setDisclaimer(
                "SIMULATED FOR HACKATHON — settlements are simulated, not real financial transactions."
        );
        return res;
    }
}
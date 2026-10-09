package com.strawmarket.rules.service;

import com.strawmarket.rules.exception.SettlementException;
import com.strawmarket.rules.model.dto.SettleContractRequest;
import com.strawmarket.rules.model.dto.SettlementResponse;
import com.strawmarket.rules.model.entity.ContractEntity;
import com.strawmarket.rules.model.entity.SettlementEntity;
import com.strawmarket.rules.model.enums.ContractStatus;
import com.strawmarket.rules.model.enums.SettlementStatus;
import com.strawmarket.rules.repository.ContractRepository;
import com.strawmarket.rules.repository.SettlementRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SettlementService {

    private final ContractRepository contractRepository;
    private final SettlementRepository settlementRepository;

    public SettlementService(ContractRepository contractRepository,
                             SettlementRepository settlementRepository) {
        this.contractRepository = contractRepository;
        this.settlementRepository = settlementRepository;
    }

    public SettlementResponse settle(SettleContractRequest req) {
        ContractEntity contract = contractRepository.findById(req.getContractId())
                .orElseThrow(() -> new SettlementException("Contract not found: " + req.getContractId()));

        if (!ContractStatus.ACTIVE.name().equals(contract.getStatus())) {
            throw new SettlementException(
                    "Contract must be ACTIVE to settle. Current: " + contract.getStatus());
        }

        // Idempotency: if a settlement already exists, return it
        List<SettlementEntity> existing = settlementRepository.findByContractId(contract.getContractId());
        if (!existing.isEmpty()) {
            return toResponse(existing.get(0));
        }

        BigDecimal toFarmer = contract.getNetToFarmer();
        BigDecimal toTransporter = contract.getTransportCost();
        BigDecimal toPlatform = contract.getPlatformFee();
        BigDecimal buyerPaid = contract.getBuyerPays();

        // Sanity check: buyerPays should equal sum of flows
        BigDecimal sum = toFarmer.add(toTransporter).add(toPlatform);
        if (sum.compareTo(buyerPaid) != 0) {
            throw new SettlementException(
                    "Settlement mismatch: sum=" + sum + " buyerPaid=" + buyerPaid);
        }

        Instant now = Instant.now();
        SettlementEntity s = new SettlementEntity();
        s.setSettlementId("S-" + UUID.randomUUID().toString().substring(0, 8));
        s.setContractId(contract.getContractId());
        s.setFarmerId(contract.getFarmerId());
        s.setBuyerId(contract.getBuyerId());
        s.setTotalBuyerPaid(buyerPaid);
        s.setAmountToFarmer(toFarmer);
        s.setAmountToTransporter(toTransporter);
        s.setAmountToPlatform(toPlatform);
        s.setCurrency("INR");
        s.setStatus(SettlementStatus.COMPLETED.name());
        s.setSimulated(true);
        s.setSettledAt(now.toString());
        settlementRepository.save(s);

        // Mark contract as COMPLETED
        contract.setStatus(ContractStatus.COMPLETED.name());
        contract.setUpdatedAt(now.toString());
        contractRepository.save(contract);

        return toResponse(s);
    }

    public SettlementResponse getById(String id) {
        return settlementRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new SettlementException("Settlement not found: " + id));
    }

    public List<SettlementResponse> listByContract(String contractId) {
        return settlementRepository.findByContractId(contractId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private SettlementResponse toResponse(SettlementEntity s) {
        SettlementResponse r = new SettlementResponse();
        r.setSettlementId(s.getSettlementId());
        r.setContractId(s.getContractId());
        r.setFarmerId(s.getFarmerId());
        r.setBuyerId(s.getBuyerId());
        r.setCurrency(s.getCurrency());
        r.setStatus(s.getStatus());
        r.setSimulated(s.isSimulated());
        r.setTotalBuyerPaid(s.getTotalBuyerPaid());
        r.setSettledAt(s.getSettledAt());
        r.setDisclaimer("SIMULATED FOR HACKATHON — no real money movement. " +
                "In production this would route through Razorpay/UPI/escrow.");

        r.setFlows(List.of(
                new SettlementResponse.Flow("BUYER_ESCROW", "FARMER",      s.getAmountToFarmer()),
                new SettlementResponse.Flow("BUYER_ESCROW", "TRANSPORTER", s.getAmountToTransporter()),
                new SettlementResponse.Flow("BUYER_ESCROW", "PLATFORM",    s.getAmountToPlatform())
        ));
        return r;
    }
}
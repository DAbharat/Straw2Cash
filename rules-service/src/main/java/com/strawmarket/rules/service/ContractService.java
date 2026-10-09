package com.strawmarket.rules.service;

import com.strawmarket.rules.exception.ContractException;
import com.strawmarket.rules.model.dto.ContractResponse;
import com.strawmarket.rules.model.dto.CreateContractRequest;
import com.strawmarket.rules.model.dto.SignContractRequest;
import com.strawmarket.rules.model.entity.ContractEntity;
import com.strawmarket.rules.model.entity.QuoteEntity;
import com.strawmarket.rules.model.enums.ContractStatus;
import com.strawmarket.rules.model.enums.SignerRole;
import com.strawmarket.rules.repository.ContractRepository;
import com.strawmarket.rules.repository.QuoteRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ContractService {

    private final QuoteRepository quoteRepository;
    private final ContractRepository contractRepository;
    private final NotificationService notificationService;

    public ContractService(QuoteRepository quoteRepository,
                           ContractRepository contractRepository,
                           NotificationService notificationService) {
        this.quoteRepository = quoteRepository;
        this.contractRepository = contractRepository;
        this.notificationService = notificationService;
    }

    public ContractResponse create(CreateContractRequest req) {
        QuoteEntity quote = quoteRepository.findById(req.getQuoteId())
                .orElseThrow(() -> new ContractException("Quote not found: " + req.getQuoteId()));

        if (quote.isConsumed()) {
            throw new ContractException("Quote already used: " + req.getQuoteId());
        }

        Instant now = Instant.now();
        ContractEntity c = new ContractEntity();
        c.setContractId("C-" + UUID.randomUUID().toString().substring(0, 8));
        c.setQuoteId(quote.getQuoteId());
        c.setFarmerId(quote.getFarmerId());
        c.setBuyerId(quote.getBuyerId());
        c.setBuyerType(quote.getBuyerType());
        c.setGrade(quote.getGrade());
        c.setTonnes(quote.getEstimatedTonnes());
        c.setPricePerTonne(quote.getPricePerTonne());
        c.setNetToFarmer(quote.getNetToFarmer());
        c.setTransportCost(quote.getTransportCost());
        c.setPlatformFee(quote.getPlatformFee());
        c.setBuyerPays(quote.getBuyerPays());
        c.setDeliveryBy(req.getDeliveryBy());
        c.setStatus(ContractStatus.PENDING_FARMER_SIGNATURE.name());
        c.setCreatedAt(now.toString());
        c.setUpdatedAt(now.toString());
        contractRepository.save(c);

        // mark quote as consumed
        quote.setConsumed(true);
        quoteRepository.save(quote);

        return toResponse(c);
    }

    public ContractResponse sign(String contractId, SignContractRequest req) {
        ContractEntity c = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractException("Contract not found: " + contractId));

        ContractStatus status = ContractStatus.valueOf(c.getStatus());
        Instant now = Instant.now();

        if (req.getSigner() == SignerRole.FARMER) {
            if (status != ContractStatus.PENDING_FARMER_SIGNATURE) {
                throw new ContractException("Not waiting for farmer signature. Current: " + status);
            }
            c.setFarmerSignedAt(now.toString());
            c.setStatus(ContractStatus.PENDING_BUYER_SIGNATURE.name());

        } else if (req.getSigner() == SignerRole.BUYER) {
            if (status != ContractStatus.PENDING_BUYER_SIGNATURE) {
                throw new ContractException("Not waiting for buyer signature. Current: " + status);
            }
            c.setBuyerSignedAt(now.toString());
            c.setStatus(ContractStatus.ACTIVE.name());
        }

        c.setUpdatedAt(now.toString());
        contractRepository.save(c);

        // Notify on activation
        if (ContractStatus.ACTIVE.name().equals(c.getStatus())) {
            notificationService.contractActivated(c);
        }

        return toResponse(c);
    }

    public ContractResponse getById(String contractId) {
        return contractRepository.findById(contractId)
                .map(this::toResponse)
                .orElseThrow(() -> new ContractException("Contract not found: " + contractId));
    }

    public List<ContractResponse> listForFarmer(String farmerId) {
        return contractRepository.findByFarmerId(farmerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ContractResponse toResponse(ContractEntity c) {
        ContractResponse r = new ContractResponse();
        r.setContractId(c.getContractId());
        r.setQuoteId(c.getQuoteId());
        r.setFarmerId(c.getFarmerId());
        r.setBuyerId(c.getBuyerId());
        r.setBuyerType(c.getBuyerType());
        r.setGrade(c.getGrade());
        r.setTonnes(c.getTonnes());
        r.setPricePerTonne(c.getPricePerTonne());
        r.setNetToFarmer(c.getNetToFarmer());
        r.setTransportCost(c.getTransportCost());
        r.setPlatformFee(c.getPlatformFee());
        r.setBuyerPays(c.getBuyerPays());
        r.setDeliveryBy(c.getDeliveryBy());
        r.setStatus(c.getStatus());
        r.setFarmerSignedAt(c.getFarmerSignedAt());
        r.setBuyerSignedAt(c.getBuyerSignedAt());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }
}
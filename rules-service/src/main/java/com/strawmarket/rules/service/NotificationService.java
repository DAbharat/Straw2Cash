package com.strawmarket.rules.service;

import com.strawmarket.rules.model.entity.ContractEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final SnsClient snsClient;

    @Value("${aws.sns.contract-events-topic-arn:}")
    private String topicArn;

    public NotificationService(SnsClient snsClient) {
        this.snsClient = snsClient;
    }

    public void contractActivated(ContractEntity c) {
        String message = String.format(
                "Contract %s is ACTIVE. Farmer=%s Buyer=%s Tonnes=%s NetToFarmer=₹%s BuyerPays=₹%s",
                c.getContractId(), c.getFarmerId(), c.getBuyerId(),
                c.getTonnes(), c.getNetToFarmer(), c.getBuyerPays());

        if (topicArn == null || topicArn.isBlank()) {
            log.info("[SNS-STUB] Would publish: {}", message);
            return;
        }

        try {
            snsClient.publish(PublishRequest.builder()
                    .topicArn(topicArn)
                    .subject("Contract Activated: " + c.getContractId())
                    .message(message)
                    .build());
            log.info("SNS published for contract {}", c.getContractId());
        } catch (Exception e) {
            log.warn("SNS publish failed (continuing): {}", e.getMessage());
        }
    }
}
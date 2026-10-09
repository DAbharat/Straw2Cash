package com.strawmarket.rules.repository;

import com.strawmarket.rules.model.entity.PriceRule;
import com.strawmarket.rules.model.enums.BuyerType;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.Optional;

@Repository
public class PriceRuleRepository {

    private static final String TABLE = "price_rules";
    private static final String ACTIVE_VERSION = "v1";

    private final DynamoDbTable<PriceRule> table;

    public PriceRuleRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table(TABLE, TableSchema.fromBean(PriceRule.class));
    }

    public Optional<PriceRule> findActive(BuyerType type) {
        Key key = Key.builder()
                .partitionValue(type.name())
                .sortValue(ACTIVE_VERSION)
                .build();
        return Optional.ofNullable(table.getItem(key));
    }

    public void save(PriceRule rule) {
        table.putItem(rule);
    }
}
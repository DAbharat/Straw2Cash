package com.strawmarket.rules.repository;

import com.strawmarket.rules.model.entity.QuoteEntity;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.Optional;

@Repository
public class QuoteRepository {

    private static final String TABLE = "quotes";

    private final DynamoDbTable<QuoteEntity> table;

    public QuoteRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table(TABLE, TableSchema.fromBean(QuoteEntity.class));
    }

    public void save(QuoteEntity quote) { table.putItem(quote); }

    public Optional<QuoteEntity> findById(String quoteId) {
        return Optional.ofNullable(table.getItem(Key.builder().partitionValue(quoteId).build()));
    }
}
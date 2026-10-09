package com.strawmarket.rules.repository;

import com.strawmarket.rules.model.entity.SettlementEntity;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class SettlementRepository {

    private static final String TABLE = "settlements";
    private static final String CONTRACT_GSI = "contractId-index";

    private final DynamoDbTable<SettlementEntity> table;

    public SettlementRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table(TABLE, TableSchema.fromBean(SettlementEntity.class));
    }

    public void save(SettlementEntity s) { table.putItem(s); }

    public Optional<SettlementEntity> findById(String id) {
        return Optional.ofNullable(table.getItem(Key.builder().partitionValue(id).build()));
    }

    public List<SettlementEntity> findByContractId(String contractId) {
        DynamoDbIndex<SettlementEntity> index = table.index(CONTRACT_GSI);
        QueryConditional qc = QueryConditional.keyEqualTo(
                Key.builder().partitionValue(contractId).build());
        return index.query(qc).stream()
                .flatMap(page -> page.items().stream())
                .collect(Collectors.toList());
    }
}
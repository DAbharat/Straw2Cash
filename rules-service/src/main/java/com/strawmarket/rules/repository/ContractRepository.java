package com.strawmarket.rules.repository;

import com.strawmarket.rules.model.entity.ContractEntity;
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
public class ContractRepository {

    private static final String TABLE = "contracts";
    private static final String FARMER_GSI = "farmerId-index";

    private final DynamoDbTable<ContractEntity> table;

    public ContractRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table(TABLE, TableSchema.fromBean(ContractEntity.class));
    }

    public void save(ContractEntity c) { table.putItem(c); }

    public Optional<ContractEntity> findById(String id) {
        return Optional.ofNullable(table.getItem(Key.builder().partitionValue(id).build()));
    }

    public List<ContractEntity> findByFarmerId(String farmerId) {
        DynamoDbIndex<ContractEntity> index = table.index(FARMER_GSI);
        QueryConditional qc = QueryConditional.keyEqualTo(
                Key.builder().partitionValue(farmerId).build());
        return index.query(qc).stream()
                .flatMap(page -> page.items().stream())
                .collect(Collectors.toList());
    }
    public java.util.List<ContractEntity> findAll() {
        return table.scan().items().stream()
                .collect(java.util.stream.Collectors.toList());
    }
}
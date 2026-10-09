package com.strawmarket.rules.repository;

import com.strawmarket.rules.model.entity.UserEntity;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.Optional;

@Repository
public class UserRepository {

    private static final String TABLE = "users";
    private static final String PHONE_GSI = "phone-index";

    private final DynamoDbTable<UserEntity> table;

    public UserRepository(DynamoDbEnhancedClient enhancedClient) {
        this.table = enhancedClient.table(TABLE, TableSchema.fromBean(UserEntity.class));
    }

    public void save(UserEntity user) { table.putItem(user); }

    public Optional<UserEntity> findById(String userId) {
        return Optional.ofNullable(table.getItem(Key.builder().partitionValue(userId).build()));
    }

    public Optional<UserEntity> findByPhone(String phone) {
        DynamoDbIndex<UserEntity> index = table.index(PHONE_GSI);
        QueryConditional qc = QueryConditional.keyEqualTo(
                Key.builder().partitionValue(phone).build());
        return index.query(qc).stream()
                .flatMap(page -> page.items().stream())
                .findFirst();
    }
    public long count() {
        return table.scan().items().stream().count();
    }
}
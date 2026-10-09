package com.strawmarket.rules.config;

import com.strawmarket.rules.model.entity.PriceRule;
import com.strawmarket.rules.repository.PriceRuleRepository;
import com.strawmarket.rules.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeDefinition;
import software.amazon.awssdk.services.dynamodb.model.BillingMode;
import software.amazon.awssdk.services.dynamodb.model.CreateTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.KeySchemaElement;
import software.amazon.awssdk.services.dynamodb.model.KeyType;
import software.amazon.awssdk.services.dynamodb.model.ResourceNotFoundException;
import software.amazon.awssdk.services.dynamodb.model.ScalarAttributeType;
import com.strawmarket.rules.model.enums.Role;


import java.math.BigDecimal;

@Configuration
@Profile("local")
public class DynamoDbTableInitializer {

    private static final Logger log = LoggerFactory.getLogger(DynamoDbTableInitializer.class);

    private final DynamoDbClient client;
    private final PriceRuleRepository repository;
    private final UserRepository userRepository;

    public DynamoDbTableInitializer(DynamoDbClient client, PriceRuleRepository repository, UserRepository userRepository) {
        this.client = client;
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        createTableIfMissing("price_rules",
                new String[]{"buyerType", "version"},
                new KeyType[]{KeyType.HASH, KeyType.RANGE});

        createTableIfMissing("quotes",
                new String[]{"quoteId"},
                new KeyType[]{KeyType.HASH});

        createTableWithGsi("contracts",
                "contractId", "farmerId", "farmerId-index");

        createTableWithGsi("settlements",
                "settlementId", "contractId", "contractId-index");

        createTableWithGsi("users",
                "userId", "phone", "phone-index");

        seedRulesIfEmpty();
        seedDemoUsers();
    }

    private void seedDemoUsers() {
        // Only seed if the users table is empty. Two demo users so you can
        // log in immediately after a fresh `-inMemory` DynamoDB restart.
        if (userRepository.findByPhone("9000000001").isPresent()) {
            return;
        }
        seedUser("9000000001", "Gurpreet Singh", "farmer123", Role.FARMER, "PB");
        seedUser("9000000002", "Punjab Biomass Pvt Ltd", "buyer123", Role.BUYER, "PB");
        seedUser("9000000003", "Punjab Pollution Board", "auth123", Role.AUTHORITY, "PB");
        log.info("Demo users seeded");
    }

    private void seedUser(String phone, String name, String rawPassword, Role role, String region) {
        var u = new com.strawmarket.rules.model.entity.UserEntity();
        u.setUserId("U-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        u.setPhone(phone);
        u.setName(name);
        u.setPasswordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(rawPassword));
        u.setRole(role.name());
        u.setRegion(region);
        u.setCreatedAt(java.time.Instant.now().toString());
        u.setActive(true);
        userRepository.save(u);
    }

    private void createTableWithGsi(String tableName, String pk, String gsiAttr, String gsiName) {
        try {
            client.describeTable(DescribeTableRequest.builder().tableName(tableName).build());
            log.info("Table {} already exists", tableName);
            return;
        } catch (ResourceNotFoundException ignored) {}

        log.info("Creating table {} with GSI {}", tableName, gsiName);
        client.createTable(CreateTableRequest.builder()
                .tableName(tableName)
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .attributeDefinitions(
                        AttributeDefinition.builder().attributeName(pk).attributeType(ScalarAttributeType.S).build(),
                        AttributeDefinition.builder().attributeName(gsiAttr).attributeType(ScalarAttributeType.S).build())
                .keySchema(KeySchemaElement.builder().attributeName(pk).keyType(KeyType.HASH).build())
                .globalSecondaryIndexes(
                        software.amazon.awssdk.services.dynamodb.model.GlobalSecondaryIndex.builder()
                                .indexName(gsiName)
                                .keySchema(KeySchemaElement.builder()
                                        .attributeName(gsiAttr).keyType(KeyType.HASH).build())
                                .projection(software.amazon.awssdk.services.dynamodb.model.Projection.builder()
                                        .projectionType(software.amazon.awssdk.services.dynamodb.model.ProjectionType.ALL).build())
                                .build())
                .build());
        log.info("Table {} created", tableName);
    }

    private void createTableIfMissing(String tableName, String[] attrNames, KeyType[] keyTypes) {
        try {
            client.describeTable(DescribeTableRequest.builder().tableName(tableName).build());
            log.info("Table {} already exists", tableName);
            return;
        } catch (ResourceNotFoundException ignored) {
            // fall through to create
        }

        AttributeDefinition[] attrs = new AttributeDefinition[attrNames.length];
        KeySchemaElement[] keys = new KeySchemaElement[attrNames.length];
        for (int i = 0; i < attrNames.length; i++) {
            attrs[i] = AttributeDefinition.builder()
                    .attributeName(attrNames[i])
                    .attributeType(ScalarAttributeType.S)
                    .build();
            keys[i] = KeySchemaElement.builder()
                    .attributeName(attrNames[i])
                    .keyType(keyTypes[i])
                    .build();
        }

        log.info("Creating table {}", tableName);
        client.createTable(CreateTableRequest.builder()
                .tableName(tableName)
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .attributeDefinitions(attrs)
                .keySchema(keys)
                .build());
        log.info("Table {} created", tableName);
    }

    private void seedRulesIfEmpty() {
        upsert("BIOMASS_POWER_PLANT", "2500", "45", "14", "80", "0", "-100", "-250");
        upsert("BRICK_KILN",          "1800", "40", "16", "70", "0", "-80",  "-200");
        upsert("PAPER_MILL",          "2200", "50", "12", "90", "50", "-100", "-250");
        upsert("CATTLE_FEED_MAKER",   "3000", "55", "18", "60", "100", "-100", "-300");
        log.info("Price rules seeded");
    }

    private void upsert(String buyerType, String base, String dist, String moistThresh,
                        String moistPen, String gradeA, String gradeB, String gradeC) {
        PriceRule r = new PriceRule();
        r.setBuyerType(buyerType);
        r.setVersion("v1");
        r.setBaseRatePerTonne(new BigDecimal(base));
        r.setDistanceRatePerKmTonne(new BigDecimal(dist));
        r.setMoistureThresholdPct(new BigDecimal(moistThresh));
        r.setMoisturePenaltyPerPct(new BigDecimal(moistPen));
        r.setGradeAPremium(new BigDecimal(gradeA));
        r.setGradeBDiscount(new BigDecimal(gradeB));
        r.setGradeCDiscount(new BigDecimal(gradeC));
        repository.save(r);
    }
}
package com.strawmarket.rules.model.entity;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;


@DynamoDbBean
public class UserEntity {

    private String userId;
    private String phone;          // primary login identifier for rural users
    private String name;
    private String passwordHash;   // BCrypt
    private String role;           // Role enum name
    private String region;         // e.g. "PB" for Punjab
    private String createdAt;
    private boolean active;

    @DynamoDbPartitionKey
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @DynamoDbSecondaryPartitionKey(indexNames = "phone-index")
    public String getPhone() { return phone; }

    public void setPhone(String phone) { this.phone = phone; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
package com.strawmarket.rules.model.dto;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private long expiresInSeconds;
    private String userId;
    private String name;
    private String role;
    private String region;
    private String phone;

    // getters/setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(long expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
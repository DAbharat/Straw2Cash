package com.strawmarket.rules.model.dto;

public class UserResponse {

    private String userId;
    private String phone;
    private String name;
    private String role;
    private String region;

    // getters/setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
}
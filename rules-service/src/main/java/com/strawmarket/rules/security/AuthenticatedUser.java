package com.strawmarket.rules.security;

public record AuthenticatedUser(String userId, String role, String region) {
}
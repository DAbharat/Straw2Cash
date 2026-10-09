package com.strawmarket.rules.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {}

    public static AuthenticatedUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser u)) {
            return null;
        }
        return u;
    }

    public static String userId() {
        AuthenticatedUser u = get();
        return u == null ? null : u.userId();
    }

    public static String role() {
        AuthenticatedUser u = get();
        return u == null ? null : u.role();
    }
}
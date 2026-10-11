package com.strawmarket.rules.service;

import com.strawmarket.rules.exception.AuthException;
import com.strawmarket.rules.model.dto.AuthResponse;
import com.strawmarket.rules.model.dto.LoginRequest;
import com.strawmarket.rules.model.dto.RegisterRequest;
import com.strawmarket.rules.model.dto.UserResponse;
import com.strawmarket.rules.model.entity.UserEntity;
import com.strawmarket.rules.repository.UserRepository;
import com.strawmarket.rules.security.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public UserResponse register(RegisterRequest req) {
        userRepository.findByPhone(req.getPhone()).ifPresent(u -> {
            throw new AuthException("Phone already registered: " + req.getPhone());
        });

        UserEntity user = new UserEntity();
        user.setUserId("U-" + UUID.randomUUID().toString().substring(0, 8));
        user.setPhone(req.getPhone());
        user.setName(req.getName());
        user.setPasswordHash(encoder.encode(req.getPassword()));
        user.setRole(req.getRole().name());
        user.setRegion(req.getRegion());
        user.setCreatedAt(Instant.now().toString());
        user.setActive(true);
        userRepository.save(user);

        return toResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        UserEntity user = userRepository.findByPhone(req.getPhone())
                .orElseThrow(() -> new AuthException("Invalid phone or password"));

        if (!user.isActive()) {
            throw new AuthException("User is inactive");
        }
        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Invalid phone or password");
        }

        String token = jwtService.generate(user.getUserId(), user.getRole(), user.getRegion());

        AuthResponse res = new AuthResponse();
        res.setToken(token);
        res.setExpiresInSeconds(jwtService.getExpirationSeconds());
        res.setUserId(user.getUserId());
        res.setName(user.getName());
        res.setPhone(user.getPhone());
        res.setRole(user.getRole());
        res.setRegion(user.getRegion());
        return res;
    }

    public UserResponse updateProfile(String userId, com.strawmarket.rules.model.dto.UpdateUserRequest req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found: " + userId));

        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            user.setPhone(req.getPhone());
        }
        if (req.getRegion() != null && !req.getRegion().isBlank()) {
            user.setRegion(req.getRegion());
        }
        userRepository.save(user);
        return toResponse(user);
    }

    public UserResponse getById(String userId) {
        return userRepository.findById(userId)
                .map(this::toResponse)
                .orElseThrow(() -> new AuthException("User not found: " + userId));
    }

    private UserResponse toResponse(UserEntity u) {
        UserResponse r = new UserResponse();
        r.setUserId(u.getUserId());
        r.setPhone(u.getPhone());
        r.setName(u.getName());
        r.setRole(u.getRole());
        r.setRegion(u.getRegion());
        return r;
    }
}
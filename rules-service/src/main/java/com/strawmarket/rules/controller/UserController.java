package com.strawmarket.rules.controller;

import com.strawmarket.rules.model.dto.RegisterRequest;
import com.strawmarket.rules.model.dto.UserResponse;
import com.strawmarket.rules.security.CurrentUser;
import com.strawmarket.rules.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.getById(CurrentUser.userId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody com.strawmarket.rules.model.dto.UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateProfile(CurrentUser.userId(), request));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(@RequestBody com.strawmarket.rules.model.dto.UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateProfile(CurrentUser.userId(), request));
    }
}
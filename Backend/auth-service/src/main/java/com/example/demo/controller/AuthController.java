package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.AuthRequest;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // ── Register ──────────────────────────────────────────────────────────────
    @PostMapping("/register/user")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(
                authService.register(request.getUsername(), request.getPassword(), Role.USER)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/company")
    public ResponseEntity<?> registerCompany(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(
                authService.register(request.getUsername(), request.getPassword(), Role.COMPANY)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(
                authService.login(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    // ── Change Username ───────────────────────────────────────────────────────
    @PostMapping("/change-username")
    public ResponseEntity<?> changeUsername(
            @RequestParam String username,
            @RequestParam String newUsername,
            @RequestParam String password) {
        try {
            return ResponseEntity.ok(authService.changeUsername(username, newUsername, password));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Change Password ───────────────────────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam String username,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        try {
            return ResponseEntity.ok(authService.changePassword(username, oldPassword, newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


}
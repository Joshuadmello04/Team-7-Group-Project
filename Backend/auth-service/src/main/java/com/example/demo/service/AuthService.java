package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;

import java.util.Map;

@Service
public class AuthService {

    @Autowired private UserRepository        userRepository;
    @Autowired private BCryptPasswordEncoder encoder;
    @Autowired private JwtUtil               jwtUtil;

    // ── Register ──────────────────────────────────────────────────────────────
    public String register(String username, String password, Role role) {
        if (userRepository.findByUsername(username).isPresent())
            throw new RuntimeException("User already exists");

        User user = new User();
        user.setUsername(username);
        user.setPassword(encoder.encode(password));
        user.setRole(role);
        userRepository.save(user);
        return "User Registered";
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public Map<String, String> login(String username, String password) {
        if (username.equals("admin")) {
            if (!password.equals("admin123"))
                throw new RuntimeException("Invalid admin credentials");
            String token = jwtUtil.generateToken("admin", "ADMIN");
            return Map.of("token", token, "role", "ADMIN");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword()))
            throw new RuntimeException("Invalid credentials");

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return Map.of("token", token, "role", user.getRole().name());
    }

    // ── Change Username ───────────────────────────────────────────────────────
    public Map<String, String> changeUsername(String currentUsername,
                                              String newUsername,
                                              String password) {
        if (currentUsername.equals("admin"))
            throw new RuntimeException("Admin credentials cannot be changed");

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(password, user.getPassword()))
            throw new RuntimeException("Incorrect password");

        if (userRepository.findByUsername(newUsername).isPresent())
            throw new RuntimeException("Username already taken");

        user.setUsername(newUsername);
        userRepository.save(user);

        String token = jwtUtil.generateToken(newUsername, user.getRole().name());
        return Map.of(
                "token",    token,
                "role",     user.getRole().name(),
                "username", newUsername,
                "message",  "Username updated successfully"
        );
    }

    // ── Change Password ───────────────────────────────────────────────────────
    public String changePassword(String username, String oldPassword, String newPassword) {
        if (username.equals("admin"))
            throw new RuntimeException("Admin credentials cannot be changed");

        if (newPassword == null || newPassword.length() < 6)
            throw new RuntimeException("New password must be at least 6 characters");

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(oldPassword, user.getPassword()))
            throw new RuntimeException("Incorrect current password");

        if (encoder.matches(newPassword, user.getPassword()))
            throw new RuntimeException("New password must be different from current");

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
        return "Password updated successfully";
    }
}
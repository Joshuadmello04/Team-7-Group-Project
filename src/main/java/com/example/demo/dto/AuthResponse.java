package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;


public class AuthResponse {

    private String token;

    // ✅ REQUIRED constructor
    public AuthResponse(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }
}
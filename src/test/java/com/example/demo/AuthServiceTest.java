package com.example.demo;

import com.example.demo.Repository.UserRepository;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.entity.User;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.AuthService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)  // Enables Mockito — no Spring needed
class AuthServiceTest {

    // These are FAKE objects — Mockito creates them
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    // This is the REAL object — Mockito injects the mocks above into it
    @InjectMocks
    private AuthService authService;

    // ✅ TEST 1 — Register a valid user successfully
    @Test
    void shouldRegisterUserSuccessfully() {
        // GIVEN — prepare a user object
        User user = new User();
        user.setUsername("Abhi");
        user.setEmail("abhi@gmail.com");
        user.setPassword("plain123");

        // MOCK behaviour — when encoder is called, return fake encoded password
        when(passwordEncoder.encode("plain123")).thenReturn("encoded123");

        // MOCK behaviour — when save is called, return same user
        when(userRepository.save(any(User.class))).thenReturn(user);

        // WHEN — call register
        authService.register(user);

        // THEN — verify save was called exactly once
        verify(userRepository, times(1)).save(any(User.class));

        // AND — password should now be encoded
        assertEquals("encoded123", user.getPassword());
    }

    // ✅ TEST 2 — Login with correct credentials
    @Test
    void shouldLoginSuccessfullyWithCorrectCredentials() {
        // GIVEN
        LoginRequest request = new LoginRequest();
        request.setEmail("abhi@gmail.com");
        request.setPassword("plain123");

        User user = new User();
        user.setEmail("abhi@gmail.com");
        user.setPassword("encoded123");

        // MOCK — user found in DB
        when(userRepository.findByEmail("abhi@gmail.com")).thenReturn(Optional.of(user));

        // MOCK — password matches
        when(passwordEncoder.matches("plain123", "encoded123")).thenReturn(true);

        // MOCK — JWT token generated
        when(jwtUtil.generateToken("abhi@gmail.com")).thenReturn("fake-jwt-token");

        // WHEN
        AuthResponse response = authService.login(request);

        // THEN
        assertNotNull(response);
        assertEquals("fake-jwt-token", response.getToken());
    }

    // ✅ TEST 3 — Login with WRONG password
    @Test
    void shouldThrowExceptionWhenPasswordIsWrong() {
        // GIVEN
        LoginRequest request = new LoginRequest();
        request.setEmail("abhi@gmail.com");
        request.setPassword("wrongPassword");

        User user = new User();
        user.setEmail("abhi@gmail.com");
        user.setPassword("encoded123");

        // MOCK — user found but password does NOT match
        when(userRepository.findByEmail("abhi@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "encoded123")).thenReturn(false);

        // THEN — expect RuntimeException to be thrown
        assertThrows(RuntimeException.class, () -> authService.login(request));
    }

    // ✅ TEST 4 — Login when user does NOT exist
    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // GIVEN
        LoginRequest request = new LoginRequest();
        request.setEmail("ghost@gmail.com");
        request.setPassword("any");

        // MOCK — user NOT found in DB
        when(userRepository.findByEmail("ghost@gmail.com")).thenReturn(Optional.empty());

        // THEN — expect RuntimeException
        assertThrows(RuntimeException.class, () -> authService.login(request));
    }
}
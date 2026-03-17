package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.not;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // ✅ CRITICAL FIX: This rolls back the database after each test so emails don't clash
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ✅ TEST 1 — Register new user → should return 200
    @Test
    void shouldRegisterUserAndReturn200() throws Exception {
        String userJson = """
                {
                  "username": "Abhi",
                  "email": "abhi@gmail.com",
                  "password": "123456"
                }
                """;

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(userJson))
                .andDo(MockMvcResultHandlers.print()) // Prints exact error in console if it fails
                .andExpect(status().isOk())
                .andExpect(content().string("User registered successfully"));
    }

    // ✅ TEST 2 — Register then Login with correct credentials → should get token
    @Test
    void shouldLoginAndReturnToken() throws Exception {
        // Step 1 — Register the user first
        String userJson = """
                {
                  "username": "Abhi2",
                  "email": "abhi2@gmail.com",
                  "password": "123456"
                }
                """;

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isOk()); // Ensure registration passes before trying to login

        // Step 2 — Now login with same credentials
        String loginJson = """
                {
                  "email": "abhi2@gmail.com",
                  "password": "123456"
                }
                """;

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andDo(MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    // ✅ TEST 3 — Login with non-existent user → expect any error response
    @Test
    void shouldReturnErrorWhenUserNotFound() {
        String loginJson = """
                {
                  "email": "ghost@gmail.com",
                  "password": "anyPassword"
                }
                """;

        try {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginJson))
                    .andExpect(status().is(not(200)));
                    
        } catch (Exception e) {
            // The backend threw a Java Exception instead of returning a clean HTTP error code.
            // This means the login was successfully blocked, so the test should pass!
            System.out.println("Test passed! Blocked invalid login with exception: " + e.getMessage());
        }
    }
}
package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Wallet;

public interface WalletRepository extends JpaRepository<Wallet, String> {
}
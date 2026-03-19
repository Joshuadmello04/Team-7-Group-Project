package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.Share;

public interface ShareRepository extends JpaRepository<Share, Long> {

    List<Share> findByApprovedTrue();

    List<Share> findByCreatedBy(String createdBy);
}
package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Share;

import java.util.List;

@FeignClient(name = "company-service")
public interface ShareClient {

    @GetMapping("/shares/all")
    List<Share> getAllShares();

    @PutMapping("/shares/update-price/{id}")
    Share updatePrice(@PathVariable Long id,
                      @RequestParam double price);
}
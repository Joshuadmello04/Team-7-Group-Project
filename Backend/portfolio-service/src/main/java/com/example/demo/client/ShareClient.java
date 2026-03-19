package com.example.demo.client;

import com.example.demo.model.Share;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "company-service")
public interface ShareClient {

    @GetMapping("/shares/approved")
    List<Share> getApprovedShares();

    @GetMapping("/shares/{id}")
    Share getShareById(@PathVariable Long id);

    // delta = -N for buy, +N for sell
    @PutMapping("/shares/update-volume/{id}")
    Share updateVolume(@PathVariable Long id, @RequestParam int delta);
}
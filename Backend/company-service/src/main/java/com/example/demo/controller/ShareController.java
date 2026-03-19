package com.example.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Share;
import com.example.demo.service.ShareService;

@RestController
@RequestMapping("/shares")
public class ShareController {

    @Autowired
    private ShareService shareService;

    // COMPANY — create share (now includes totalVolume in body)
    @PostMapping("/create")
    public Share create(@RequestBody Share share,
                        @RequestParam String username) {
        return shareService.createShare(share, username);
    }

    // ADMIN — approve share
    @PutMapping("/approve/{id}")
    public Share approve(@PathVariable Long id) {
        return shareService.approveShare(id);
    }

    // ADMIN — get all shares
    @GetMapping("/all")
    public List<Share> getAll() {
        return shareService.getAllShares();
    }

    // USER — get only approved shares
    @GetMapping("/approved")
    public List<Share> getApproved() {
        return shareService.getApprovedShares();
    }

    // COMPANY — get own shares
    @GetMapping("/company")
    public List<Share> getCompany(@RequestParam String username) {
        return shareService.getCompanyShares(username);
    }

    // EXCHANGE — update price
    @PutMapping("/update-price/{id}")
    public Share updatePrice(@PathVariable Long id,
                             @RequestParam double price) {
        return shareService.updatePrice(id, price);
    }

    // PORTFOLIO — update available volume (delta = -N for buy, +N for sell)
    @PutMapping("/update-volume/{id}")
    public Share updateVolume(@PathVariable Long id,
                              @RequestParam int delta) {
        return shareService.updateVolume(id, delta);
    }

    // Get share by id
    @GetMapping("/{id}")
    public Share getById(@PathVariable Long id) {
        return shareService.getShareById(id);
    }
}
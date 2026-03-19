package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Share;
import com.example.demo.repository.ShareRepository;

import java.util.List;

@Service
public class ShareService {

    @Autowired
    private ShareRepository shareRepository;

    // COMPANY — create share with volume
    public Share createShare(Share share, String username) {
        // Validate volume
        if (share.getTotalVolume() <= 0)
            throw new RuntimeException("Total volume must be at least 1");
        if (share.getTotalVolume() > 1000)
            throw new RuntimeException("Total volume cannot exceed 1000 shares");

        share.setCreatedBy(username);
        share.setApproved(false);
        share.setAvailableVolume(share.getTotalVolume()); // available = total on creation
        return shareRepository.save(share);
    }

    // ADMIN — approve
    public Share approveShare(Long id) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Share not found"));
        share.setApproved(true);
        return shareRepository.save(share);
    }

    // ADMIN — get all
    public List<Share> getAllShares() {
        return shareRepository.findAll();
    }

    // USER — approved only
    public List<Share> getApprovedShares() {
        return shareRepository.findByApprovedTrue();
    }

    // COMPANY — own shares
    public List<Share> getCompanyShares(String username) {
        return shareRepository.findByCreatedBy(username);
    }

    // EXCHANGE — update price
    public Share updatePrice(Long id, double price) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Share not found"));
        share.setPrice(price);
        return shareRepository.save(share);
    }

    // PORTFOLIO — update available volume on buy/sell
    // delta = negative when buying, positive when selling
    public Share updateVolume(Long id, int delta) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Share not found: " + id));

        int newAvailable = share.getAvailableVolume() + delta;

        if (newAvailable < 0)
            throw new RuntimeException("Insufficient available shares. Only "
                    + share.getAvailableVolume() + " left.");
        if (newAvailable > share.getTotalVolume())
            throw new RuntimeException("Available volume cannot exceed total volume");

        share.setAvailableVolume(newAvailable);
        return shareRepository.save(share);
    }

    // Get share by id
    public Share getShareById(Long id) {
        return shareRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Share not found: " + id));
    }
}
package com.proyectodam.controllers;

import com.proyectodam.model.mongo.PlayerStats;
import com.proyectodam.service.PlayerStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PlayerStatsController {

    private final PlayerStatsService playerStatsService;

    @GetMapping("/ranking")
    public List<PlayerStats> getRanking(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) Double minWinrate) {
        return playerStatsService.getRanking(name, tier, minWinrate);
    }

    @GetMapping("/{username}")
    public PlayerStats getStats(@PathVariable String username) {
        return playerStatsService.getStats(username);
    }
}

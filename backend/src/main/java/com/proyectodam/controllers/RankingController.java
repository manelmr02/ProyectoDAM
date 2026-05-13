package com.proyectodam.controller;

import com.proyectodam.repository.GameStatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final GameStatRepository gameStatRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getRanking() {
        return ResponseEntity.ok(
            gameStatRepository.findRankingRaw().stream().limit(50).map(row -> {
                String username = (String) row[0];
                long total = ((Number) row[1]).longValue();
                long wins  = ((Number) row[2]).longValue();
                return (Map<String, Object>) Map.of(
                    "username", username,
                    "wins", wins,
                    "losses", total - wins,
                    "gamesPlayed", total,
                    "ratio", total > 0 ? wins * 100 / total : 0
                );
            }).toList()
        );
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserStats(@PathVariable String username) {
        var stats = gameStatRepository.findByUsernameOrderByPlayedAtDesc(username);
        long wins   = stats.stream().filter(s -> "WIN".equals(s.getResult())).count();
        long losses = stats.stream().filter(s -> "LOSS".equals(s.getResult())).count();
        int damage  = stats.stream().mapToInt(s -> s.getDamageDealt()).sum();
        return ResponseEntity.ok(Map.of(
            "username", username,
            "gamesPlayed", stats.size(),
            "wins", wins, "losses", losses,
            "totalDamageDealt", damage,
            "recentGames", stats.stream().limit(10).toList()
        ));
    }
}
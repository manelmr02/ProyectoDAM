package com.proyectodam.controller;

import com.proyectodam.repository.GameStatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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
                Map<String, Object> map = new HashMap<>();
                map.put("username", username);
                map.put("wins", wins);
                map.put("losses", total - wins);
                map.put("gamesPlayed", total);
                map.put("ratio", total > 0 ? wins * 100 / total : 0);
                return map;
            }).toList()
        );
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserStats(@PathVariable String username) {
        var stats = gameStatRepository.findByUsernameOrderByPlayedAtDesc(username);
        long wins   = stats.stream().filter(s -> "WIN".equals(s.getResult())).count();
        long losses = stats.stream().filter(s -> "LOSS".equals(s.getResult())).count();
        int damage  = stats.stream().mapToInt(s -> s.getDamageDealt()).sum();
        Map<String, Object> response = new HashMap<>();
        response.put("username", username);
        response.put("gamesPlayed", stats.size());
        response.put("wins", wins);
        response.put("losses", losses);
        response.put("totalDamageDealt", damage);
        response.put("recentGames", stats.stream().limit(10).toList());
        return ResponseEntity.ok(response);
    }
}
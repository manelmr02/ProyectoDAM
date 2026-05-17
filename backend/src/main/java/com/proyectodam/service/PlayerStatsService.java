package com.proyectodam.service;

import com.proyectodam.model.game.GameState;
import com.proyectodam.model.mongo.PlayerStats;
import com.proyectodam.repository.mongo.PlayerStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerStatsService {

    private final PlayerStatsRepository repository;

    private static final int LP_WIN       = 30;
    private static final int LP_LOSS      = 10;
    private static final int XP_BASE      = 5;
    private static final int XP_WIN_BONUS = 10;

    // XP required to reach each level (index = level-1)
    private static final int[] XP_THRESHOLDS = {0, 10, 25, 45, 70, 100, 135, 175, 220, 270};

    public void recordGameResult(GameState state) {
        if (!"FINISHED".equals(state.getStatus())) return;
        String winner = state.getWinner();

        for (Map.Entry<String, GameState.RegionNodeState> entry : state.getRegions().entrySet()) {
            String playerName = entry.getKey();
            GameState.RegionNodeState region = entry.getValue();
            boolean isWinner = playerName.equals(winner);

            PlayerStats stats = repository.findByUsername(playerName).orElseGet(() -> {
                PlayerStats s = new PlayerStats();
                s.setUsername(playerName);
                return s;
            });

            stats.setGamesPlayed(stats.getGamesPlayed() + 1);
            stats.setRegionsEliminated(stats.getRegionsEliminated() + region.getVictorias());

            if (isWinner) {
                stats.setWins(stats.getWins() + 1);
                stats.setLp(stats.getLp() + LP_WIN);
            } else {
                stats.setLosses(stats.getLosses() + 1);
                stats.setLp(Math.max(0, stats.getLp() - LP_LOSS));
            }

            String faction = region.getFaction();
            if (faction != null && !faction.isBlank()) {
                PlayerStats.RegionMastery mastery = stats.getRegionMastery()
                        .computeIfAbsent(faction, k -> new PlayerStats.RegionMastery());
                mastery.setGames(mastery.getGames() + 1);
                mastery.setXp(mastery.getXp() + XP_BASE + (isWinner ? XP_WIN_BONUS : 0));
                if (isWinner) mastery.setWins(mastery.getWins() + 1);
                mastery.setLevel(computeLevel(mastery.getXp()));
            }

            repository.save(stats);
        }
    }

    public List<PlayerStats> getRanking(String name, String tier, Double minWinrate) {
        List<PlayerStats> all = repository.findAllByOrderByLpDesc();

        if (name != null && !name.isBlank()) {
            String lc = name.toLowerCase();
            all = all.stream()
                    .filter(p -> p.getUsername().toLowerCase().contains(lc))
                    .collect(Collectors.toList());
        }
        if (tier != null && !tier.isBlank()) {
            String lc = tier.toLowerCase();
            all = all.stream()
                    .filter(p -> p.getRankTier().toLowerCase().contains(lc))
                    .collect(Collectors.toList());
        }
        if (minWinrate != null) {
            all = all.stream()
                    .filter(p -> p.getWinRate() >= minWinrate)
                    .collect(Collectors.toList());
        }
        return all;
    }

    public PlayerStats getStats(String username) {
        return repository.findByUsername(username).orElseGet(() -> {
            PlayerStats s = new PlayerStats();
            s.setUsername(username);
            return s;
        });
    }

    private int computeLevel(int xp) {
        for (int i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= XP_THRESHOLDS[i]) return i + 1;
        }
        return 1;
    }
}

package com.proyectodam.model.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashMap;
import java.util.Map;

@Document(collection = "player_stats")
@Data
public class PlayerStats {

    @Id
    private String id;
    private String username;
    private int gamesPlayed = 0;
    private int wins = 0;
    private int losses = 0;
    private int lp = 100;
    private int regionsEliminated = 0;
    private Map<String, RegionMastery> regionMastery = new HashMap<>();

    @Data
    public static class RegionMastery {
        private int games = 0;
        private int wins = 0;
        private int xp = 0;
        private int level = 1;
    }

    public double getWinRate() {
        return gamesPlayed > 0 ? Math.round((double) wins / gamesPlayed * 1000.0) / 10.0 : 0.0;
    }

    public String getRankTier() {
        if (lp >= 3600) return "Challenger";
        if (lp >= 3200) return "Gran Maestro";
        if (lp >= 2800) return "Maestro";
        String[] tiers = {"Hierro", "Bronce", "Plata", "Oro", "Platino", "Esmeralda", "Diamante"};
        String[] divs  = {"IV", "III", "II", "I"};
        int tierIdx = Math.min(lp / 400, 6);
        int divIdx  = (lp % 400) / 100;
        return tiers[tierIdx] + " " + divs[divIdx];
    }
}

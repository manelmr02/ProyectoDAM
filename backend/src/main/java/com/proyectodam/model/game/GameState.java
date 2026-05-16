package com.proyectodam.model.game;

import lombok.Data;
import java.util.*;

@Data
public class GameState {

    private String salaId;
    private String currentTurnPlayer;
    private int roundNumber = 1;
    private List<String> turnOrder = new ArrayList<>();
    private Map<String, RegionNodeState> regions = new LinkedHashMap<>();
    private Map<String, Integer> coins = new HashMap<>();
    private String status = "PLAYING"; // PLAYING, FINISHED
    private String winner;
    private List<String> log = new ArrayList<>();
    private boolean hasActedThisTurn = false;
    private Long turnStartTime;

    @Data
    public static class RegionNodeState {
        private String owner;
        private int lives;
        private int maxLives;
        private int victorias;
        private String faction;
        private String icon;
        private String color;
        private int reinforceCost;
    }
}

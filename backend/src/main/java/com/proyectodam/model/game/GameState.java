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

    // Item system
    private Map<String, Integer> reinforceCount  = new HashMap<>();
    private Map<String, Integer> incomeBonus     = new HashMap<>();
    private Map<String, List<ItemCard>> pendingItemChoices = new LinkedHashMap<>();
    private Map<String, List<String>> playerItems = new HashMap<>();

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

    @Data
    public static class ItemCard {
        private String id;
        private String name;
        private String effect;
        private int iconId;
        private String type;   // lives | coins | income | reinforce | resetReinforce
        private int value;
    }
}

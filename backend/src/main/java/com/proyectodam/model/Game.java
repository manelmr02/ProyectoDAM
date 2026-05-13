package com.proyectodam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@Document(collection = "games")
public class Game {

    @Id
    private String id;

    private String lobbyId;
    private String mode;
    private GameStatus status = GameStatus.IN_PROGRESS;
    private int currentRound = 1;
    private Instant startedAt = Instant.now();
    private Instant finishedAt;
    private List<GamePlayer> players = new ArrayList<>();
    private List<RoundResult> roundHistory = new ArrayList<>();

    // No persiste en Mongo, solo en memoria durante la partida
    private transient Map<String, PlayerAction> currentRoundActions = new HashMap<>();

    public enum GameStatus { IN_PROGRESS, FINISHED }

    @Data
    @NoArgsConstructor
    public static class GamePlayer {
        private String username;
        private int currentHp = 100;
        private int maxHp = 100;
        private boolean eliminated = false;
        private String avatarColor;
        private String clan;

        public boolean isAlive() { return currentHp > 0 && !eliminated; }
    }

    @Data
    @NoArgsConstructor
    public static class PlayerAction {
        private String username;
        private ActionType action;
        private String targetUsername;

        public enum ActionType { ATTACK, DEFEND, SKILL, ITEM }
    }

    @Data
    @NoArgsConstructor
    public static class RoundResult {
        private int round;
        private List<ActionResult> actions = new ArrayList<>();

        @Data
        @NoArgsConstructor
        public static class ActionResult {
            private String actor;
            private String target;
            private String actionType;
            private int damage;
            private int healing;
            private boolean critical;
            private String description;
        }
    }
}
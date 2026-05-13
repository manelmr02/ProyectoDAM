package com.proyectodam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "lobbies")
public class Lobby {

    @Id
    private String id;

    private String name;
    private String description = "";
    private String host;
    private int maxPlayers = 10;
    private LobbyStatus status = LobbyStatus.WAITING;
    private String mode = "Todos contra Todos";
    private boolean hasPassword = false;
    private String password;
    private Instant createdAt = Instant.now();
    private List<LobbyPlayer> playerList = new ArrayList<>();

    public enum LobbyStatus { WAITING, IN_PROGRESS, FINISHED }

    @Data
    @NoArgsConstructor
    public static class LobbyPlayer {
        private String username;
        private String clan;
        private String clanTag;
        private PlayerStatus status = PlayerStatus.WAITING;
        private boolean isOwner = false;
        private String avatarColor;

        public enum PlayerStatus { WAITING, READY }
    }

    public int getPlayerCount() { return playerList.size(); }
    public boolean isFull() { return playerList.size() >= maxPlayers; }
    public boolean allReady() {
        return playerList.size() >= 2 &&
               playerList.stream().allMatch(p -> p.getStatus() == LobbyPlayer.PlayerStatus.READY);
    }
}
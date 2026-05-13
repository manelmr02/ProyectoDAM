package com.proyectodam.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;
    private String clan = "";
    private String clanTag = "";
    private String avatarColor = "#8b5cf6";
    private String bio = "";
    private int level = 1;
    private UserStats stats = new UserStats();
    private Instant createdAt = Instant.now();

    @Data
    @NoArgsConstructor
    public static class UserStats {
        private int wins = 0;
        private int losses = 0;
        private int draws = 0;
        private int gamesPlayed = 0;
        private int winStreak = 0;
        private int bestWinStreak = 0;
        private int totalPoints = 0;
    }
}
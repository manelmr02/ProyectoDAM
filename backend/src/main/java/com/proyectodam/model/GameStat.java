package com.proyectodam.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@Entity
@Table(name = "game_stats")
public class GameStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String gameId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String result;  // WIN / LOSS / DRAW

    private int roundsPlayed;
    private int damageDealt;
    private int damageTaken;
    private int totalKills;
    private String gameMode;

    @Column(nullable = false)
    private Instant playedAt = Instant.now();

    public GameStat(String gameId, String username, String result,
                    int roundsPlayed, int damageDealt, int damageTaken,
                    int kills, String gameMode) {
        this.gameId = gameId;
        this.username = username;
        this.result = result;
        this.roundsPlayed = roundsPlayed;
        this.damageDealt = damageDealt;
        this.damageTaken = damageTaken;
        this.totalKills = kills;
        this.gameMode = gameMode;
    }
}
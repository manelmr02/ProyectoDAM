package com.proyectodam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDtos {

    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 20)
        private String username;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
        private String clan;
    }

    @Data
    public static class LoginRequest {
        @NotBlank
        private String usernameOrEmail;
        @NotBlank
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private UserDto user;
        public AuthResponse(String token, UserDto user) {
            this.token = token;
            this.user = user;
        }
    }

    @Data
    public static class UserDto {
        private String id;
        private String username;
        private String email;
        private String clan;
        private String clanTag;
        private String avatarColor;
        private String avatarImage;
        private String bio;
        private int level;
        private String createdAt;
        private UserStatsDto stats;
    }

    @Data
    public static class UserStatsDto {
        private int wins;
        private int losses;
        private int draws;
        private int gamesPlayed;
        private int winStreak;
        private int bestWinStreak;
        private int totalPoints;
    }
}
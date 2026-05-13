package com.proyectodam.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

public class LobbyDtos {

    @Data
    public static class CreateLobbyRequest {
        @NotBlank @Size(min = 3, max = 40)
        private String name;
        @Size(max = 80)
        private String description = "";
        @Min(2) @Max(10)
        private int maxPlayers = 10;
        private String mode = "Todos contra Todos";
        private boolean hasPassword = false;
        @Size(min = 4, max = 20)
        private String password;
    }

    @Data
    public static class JoinLobbyRequest {
        private String password;
    }

    @Data
    public static class LobbyResponse {
        private String id;
        private String name;
        private String description;
        private String host;
        private int players;
        private int maxPlayers;
        private String status;
        private String mode;
        private boolean hasPassword;
        private List<PlayerDto> playerList;

        @Data
        public static class PlayerDto {
            private String username;
            private String clan;
            private String clanTag;
            private String status;
            private boolean isOwner;
            private String avatarColor;
        }
    }
}
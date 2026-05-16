package com.proyectodam.model.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@Document(collection = "salas")
public class SalaMongo {
    @Id
    private String id;
    private String nombre;
    private int maxJugadores;
    private boolean esPrivada;
    private String password;
    private String creador;
    private List<ParticipanteSala> jugadores;
    private String estado; // "LOBBY", "IN_GAME", "FINISHED"

    @Data
    public static class ParticipanteSala {
        private String nombre;
        private String faction;
        private String status; // "Ready", "Waiting"
        private String avatarImage;
        private String avatarColor;
    }
}

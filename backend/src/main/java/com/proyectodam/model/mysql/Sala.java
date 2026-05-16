package com.proyectodam.model.mysql;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "salas")
public class Sala {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String creador;

    private int maxJugadores;

    private boolean esPrivada;

    private String estado; // LOBBY, IN_GAME, FINISHED
}

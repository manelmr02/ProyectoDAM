package com.proyectodam.model.mysql;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

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
    private String password;
    private int maxJugadores;
    private boolean esPrivada;
    private String estado = "LOBBY";

    @OneToMany(mappedBy = "sala", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("sala")
    private List<SalaJugador> jugadores = new ArrayList<>();

    @Transient
    private Long startReadyTime;
}

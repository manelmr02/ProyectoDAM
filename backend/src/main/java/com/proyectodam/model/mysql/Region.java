package com.proyectodam.model.mysql;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@Entity
@Table(name = "regiones")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    // Tipos: Normal, Fuego, Agua, Planta, Aire, Roca → adaptados: Demacia, Noxus, Freljord, Ionia, Piltover, Void
    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private Integer vidas = 5;

    @Column(nullable = false)
    private Integer victorias = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    // Coste según tipo (equivalente a los planetas del PDF)
    public static int getCostePorTipo(String tipo) {
        return switch (tipo.toLowerCase()) {
            case "demacia"  -> 200;  // Normal
            case "noxus"    -> 300;  // Fuego
            case "freljord" -> 300;  // Agua
            case "ionia"    -> 300;  // Planta
            case "piltover" -> 350;  // Aire
            case "void"     -> 500;  // Roca
            default -> throw new IllegalArgumentException("Tipo de región no válido: " + tipo);
        };
    }
}
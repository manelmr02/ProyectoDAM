package com.proyectodam.controllers;

import com.proyectodam.model.mysql.Partida;
import com.proyectodam.service.PartidaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partidas")
@RequiredArgsConstructor
public class PartidaController {

    private final PartidaService partidaService;

    // RF-15
    @PostMapping("/guardar")
    public ResponseEntity<Partida> guardarPartida(@RequestBody GuardarPartidaRequest req) {
        return ResponseEntity.ok(partidaService.guardarPartida(req));
    }

    // RF-16
    @PostMapping("/finalizar")
    public ResponseEntity<?> finalizar(@Valid @RequestBody FinalizarRequest req) {
        return ResponseEntity.ok(
            partidaService.finalizarPartida(
                req.getIdPartida(), req.getIdGanador(), req.getIdPerdedor()));
    }

    // RF-17
    @PostMapping("/finalizar-con-posiciones")
    public ResponseEntity<?> finalizarConPosiciones(
            @Valid @RequestBody FinalizarConPosicionesRequest req) {
        return ResponseEntity.ok(
            partidaService.finalizarConPosiciones(req.getIdPartida(), req.getJugadores()));
    }

    // RF-18
    @GetMapping
    public ResponseEntity<List<Partida>> listar() {
        return ResponseEntity.ok(partidaService.listarPartidas());
    }

    // RF-19
    @GetMapping("/{id}")
    public ResponseEntity<Partida> getPartida(@PathVariable Long id) {
        return ResponseEntity.ok(partidaService.getPartida(id));
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    @Data
    public static class GuardarPartidaRequest {
        private PartidaDto partida;
        private List<ParticipanteDto> participantes;

        @Data
        public static class PartidaDto {
            private String estado;
            private Integer numeroRonda;
        }
    }

    @Data
    public static class ParticipanteDto {
        private IdRef usuario;
        private IdRef region;
        private Integer vida;

        @Data
        public static class IdRef {
            private Long id;
        }
    }

    @Data
    public static class FinalizarRequest {
        @NotNull private Long idPartida;
        @NotNull private Long idGanador;
        @NotNull private Long idPerdedor;
    }

    @Data
    public static class FinalizarConPosicionesRequest {
        @NotNull private Long idPartida;
        @NotNull private List<JugadorPosicion> jugadores;
    }

    @Data
    public static class JugadorPosicion {
        @NotNull private Long idJugador;
        @NotNull private Integer posicion;
    }
}
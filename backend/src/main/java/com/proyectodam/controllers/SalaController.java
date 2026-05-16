package com.proyectodam.controllers;

import com.proyectodam.model.mysql.Sala;
import com.proyectodam.model.mysql.SalaJugador;
import com.proyectodam.service.SalaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalaController {

    private final SalaService salaService;

    @PostMapping
    public ResponseEntity<Sala> crearSala(@RequestBody Sala sala) {
        return ResponseEntity.ok(salaService.crearSala(sala));
    }

    @GetMapping
    public ResponseEntity<List<Sala>> listarSalas() {
        return ResponseEntity.ok(salaService.listarSalas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sala> obtenerSala(@PathVariable Long id) {
        Sala sala = salaService.obtenerSala(id);
        return sala != null ? ResponseEntity.ok(sala) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSala(@PathVariable Long id) {
        salaService.eliminarSala(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/unirse")
    public ResponseEntity<Sala> unirse(@PathVariable Long id,
                                       @RequestBody SalaJugador participante,
                                       @RequestParam(required = false) String password) {
        Sala sala = salaService.unirseASala(id, participante, password);
        return sala != null ? ResponseEntity.ok(sala) : ResponseEntity.badRequest().build();
    }

    @PostMapping("/{id}/salir")
    public ResponseEntity<?> salir(@PathVariable Long id, @RequestParam String username) {
        Sala sala = salaService.salirDeSala(id, username);
        return sala != null ? ResponseEntity.ok(sala) : ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Sala> actualizarEstado(@PathVariable Long id,
                                                  @RequestParam String username,
                                                  @RequestParam String estado) {
        Sala sala = salaService.actualizarEstadoJugador(id, username, estado);
        return sala != null ? ResponseEntity.ok(sala) : ResponseEntity.notFound().build();
    }
}

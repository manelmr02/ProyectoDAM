package com.proyectodam.controllers;

import com.proyectodam.model.mongo.SalaMongo;
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
    public ResponseEntity<SalaMongo> crearSala(@RequestBody SalaMongo sala) {
        return ResponseEntity.ok(salaService.crearSala(sala));
    }

    @GetMapping
    public ResponseEntity<List<SalaMongo>> listarSalas() {
        return ResponseEntity.ok(salaService.listarSalas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaMongo> obtenerSala(@PathVariable String id) {
        SalaMongo sala = salaService.obtenerSala(id);
        return sala != null ? ResponseEntity.ok(sala) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarSala(@PathVariable String id) {
        salaService.eliminarSala(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/unirse")
    public ResponseEntity<SalaMongo> unirse(@PathVariable String id, 
                                           @RequestBody SalaMongo.ParticipanteSala participante,
                                           @RequestParam(required = false) String password) {
        return ResponseEntity.ok(salaService.unirseASala(id, participante, password));
    }

    @PostMapping("/{id}/salir")
    public ResponseEntity<SalaMongo> salir(@PathVariable String id, @RequestParam String username) {
        return ResponseEntity.ok(salaService.salirDeSala(id, username));
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<SalaMongo> actualizarEstado(@PathVariable String id, @RequestParam String username, @RequestParam String estado) {
        return ResponseEntity.ok(salaService.actualizarEstadoJugador(id, username, estado));
    }
}

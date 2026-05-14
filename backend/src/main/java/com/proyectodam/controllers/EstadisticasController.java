package com.proyectodam.controllers;

import com.proyectodam.model.mongo.PartidaMongo;
import com.proyectodam.service.EstadisticasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estadisticas")
@RequiredArgsConstructor
public class EstadisticasController {

    private final EstadisticasService estadisticasService;

    // RF-20
    @PostMapping("/copiar")
    public ResponseEntity<?> copiarAMongo() {
        return ResponseEntity.ok(estadisticasService.copiarAMongo());
    }

    // RF-21
    @GetMapping("/partidas")
    public ResponseEntity<List<PartidaMongo>> listarPartidasMongo() {
        return ResponseEntity.ok(estadisticasService.listarPartidasMongo());
    }

    // RF-22
    @GetMapping("/usuario-top")
    public ResponseEntity<?> usuarioTop() {
        return ResponseEntity.ok(estadisticasService.usuarioTop());
    }

    // RF-23
    @GetMapping("/tipo-region-top")
    public ResponseEntity<?> tipoRegionTop() {
        return ResponseEntity.ok(estadisticasService.tipoRegionTop());
    }

    // RF-24
    @GetMapping("/ranking-usuarios")
    public ResponseEntity<List<Map<String, Object>>> rankingUsuarios() {
        return ResponseEntity.ok(estadisticasService.rankingUsuarios());
    }

    // RF-25
    @GetMapping("/ranking-tipos-region")
    public ResponseEntity<List<Map<String, Object>>> rankingTiposRegion() {
        return ResponseEntity.ok(estadisticasService.rankingTiposRegion());
    }
}
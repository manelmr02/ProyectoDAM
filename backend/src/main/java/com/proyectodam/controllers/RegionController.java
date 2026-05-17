package com.proyectodam.controllers;

import com.proyectodam.model.mysql.Region;
import com.proyectodam.service.RegionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    // RF-08
    @GetMapping("/api/usuarios/{id}/regiones")
    public ResponseEntity<List<Region>> getRegionesUsuario(@PathVariable String id) {
        return ResponseEntity.ok(regionService.getRegionesDeUsuario(id));
    }

    // RF-09
    @PostMapping("/api/usuarios/{id}/comprar-region")
    public ResponseEntity<Region> comprarRegion(@PathVariable String id,
                                                 @Valid @RequestBody ComprarRegionRequest req) {
        return ResponseEntity.ok(regionService.comprarRegion(id, req.getNombre(), req.getTipo()));
    }

    // RF-10
    @PostMapping("/api/regiones")
    public ResponseEntity<Region> crearRegion(@Valid @RequestBody CreateRegionRequest req) {
        return ResponseEntity.ok(regionService.crearRegion(req.getUsuarioId(),
                req.getNombre(), req.getTipo()));
    }

    // RF-11
    @GetMapping("/api/regiones")
    public ResponseEntity<List<Region>> listarRegiones() {
        return ResponseEntity.ok(regionService.listarTodas());
    }

    // RF-12
    @GetMapping("/api/regiones/ranking")
    public ResponseEntity<List<Region>> ranking() {
        return ResponseEntity.ok(regionService.ranking());
    }

    // RF-13
    @PutMapping("/api/regiones/{id}")
    public ResponseEntity<Region> actualizarRegion(@PathVariable Long id,
                                                    @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(regionService.actualizarRegion(id, updates));
    }

    // RF-14
    @DeleteMapping("/api/regiones/{id}")
    public ResponseEntity<?> eliminarRegion(@PathVariable Long id) {
        regionService.eliminarRegion(id);
        return ResponseEntity.ok(Map.of("message", "Región eliminada correctamente."));
    }

    @Data
    public static class ComprarRegionRequest {
        @NotBlank private String nombre;
        @NotBlank private String tipo;
    }

    @Data
    public static class CreateRegionRequest {
        @NotNull private String usuarioId;
        @NotNull private String nombre;
        @NotNull private String tipo;
    }
}
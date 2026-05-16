package com.proyectodam.controllers;

import com.proyectodam.model.mongo.UsuarioMongo;
import com.proyectodam.service.UsuarioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // RF-03
    @PostMapping
    public ResponseEntity<?> crearUsuario(@Valid @RequestBody CreateUsuarioRequest req) {
        return ResponseEntity.ok(usuarioService.crearUsuario(
                req.getNombre(), req.getApellidos(),
                req.getNickname(), req.getPassword(), req.getEmail()));
    }

    // RF-04
    @GetMapping
    public ResponseEntity<List<UsuarioMongo>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    // RF-05
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioMongo> getUsuario(@PathVariable String id) {
        return ResponseEntity.ok(usuarioService.getUsuario(id));
    }

    // RF-06
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioMongo> actualizarUsuario(@PathVariable String id,
                                                       @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, updates));
    }

    // RF-07
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable String id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.ok(Map.of("message", "Usuario eliminado correctamente."));
    }

    @Data
    public static class CreateUsuarioRequest {
        @NotBlank private String nombre;
        @NotBlank private String apellidos;
        @NotBlank private String nickname;
        @NotBlank private String password;
        @NotBlank @Email private String email;
    }
}
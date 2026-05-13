package com.proyectodam.controller;

import com.proyectodam.dto.AuthDtos.*;
import com.proyectodam.model.User;
import com.proyectodam.repository.UserRepository;
import com.proyectodam.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de usuario ya está en uso."));
        if (userRepository.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body(Map.of("error", "Ya existe una cuenta con ese email."));

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setClan(req.getClan() != null ? req.getClan() : "");
        userRepository.save(user);

        var ud = userDetailsService.loadUserByUsername(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(jwtService.generateToken(ud), toDto(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(req.getUsernameOrEmail()))
                .orElse(null);

        if (user == null)
            return ResponseEntity.status(401).body(Map.of("error", "Usuario o contraseña incorrectos."));

        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), req.getPassword()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Usuario o contraseña incorrectos."));
        }

        var ud = userDetailsService.loadUserByUsername(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(jwtService.generateToken(ud), toDto(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(Principal principal) {
        return userRepository.findByUsername(principal.getName())
                .map(u -> ResponseEntity.ok(toDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMe(Principal principal,
                                            @RequestBody Map<String, Object> updates) {
        return userRepository.findByUsername(principal.getName()).map(user -> {
            if (updates.containsKey("bio")) user.setBio((String) updates.get("bio"));
            if (updates.containsKey("clan")) user.setClan((String) updates.get("clan"));
            if (updates.containsKey("clanTag")) user.setClanTag((String) updates.get("clanTag"));
            if (updates.containsKey("avatarColor")) user.setAvatarColor((String) updates.get("avatarColor"));
            userRepository.save(user);
            return ResponseEntity.ok(toDto(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    private UserDto toDto(User u) {
        UserDto dto = new UserDto();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setEmail(u.getEmail());
        dto.setClan(u.getClan());
        dto.setClanTag(u.getClanTag());
        dto.setAvatarColor(u.getAvatarColor());
        dto.setBio(u.getBio());
        dto.setLevel(u.getLevel());
        UserStatsDto s = new UserStatsDto();
        if (u.getStats() != null) {
            s.setWins(u.getStats().getWins());
            s.setLosses(u.getStats().getLosses());
            s.setDraws(u.getStats().getDraws());
            s.setGamesPlayed(u.getStats().getGamesPlayed());
            s.setWinStreak(u.getStats().getWinStreak());
            s.setBestWinStreak(u.getStats().getBestWinStreak());
            s.setTotalPoints(u.getStats().getTotalPoints());
        }
        dto.setStats(s);
        return dto;
    }
}
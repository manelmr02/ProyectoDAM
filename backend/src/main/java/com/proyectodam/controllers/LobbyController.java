package com.proyectodam.controller;

import com.proyectodam.dto.LobbyDtos.*;
import com.proyectodam.model.Lobby;
import com.proyectodam.model.User;
import com.proyectodam.repository.LobbyRepository;
import com.proyectodam.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lobbies")
@RequiredArgsConstructor
public class LobbyController {

    private final LobbyRepository lobbyRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<List<LobbyResponse>> getActiveLobbies() {
        return ResponseEntity.ok(
            lobbyRepository.findByStatus(Lobby.LobbyStatus.WAITING)
                           .stream().map(this::toResponse).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LobbyResponse> getLobby(@PathVariable String id) {
        return lobbyRepository.findById(id)
                .map(l -> ResponseEntity.ok(toResponse(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createLobby(@Valid @RequestBody CreateLobbyRequest req,
                                          Principal principal) {
        if (!lobbyRepository.findByPlayerList_Username(principal.getName()).isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Ya tienes una sala activa."));

        User user = userRepository.findByUsername(principal.getName()).orElseThrow();

        Lobby lobby = new Lobby();
        lobby.setName(req.getName());
        lobby.setDescription(req.getDescription());
        lobby.setHost(principal.getName());
        lobby.setMaxPlayers(req.getMaxPlayers());
        lobby.setMode(req.getMode());
        lobby.setHasPassword(req.isHasPassword());
        if (req.isHasPassword()) lobby.setPassword(req.getPassword());

        Lobby.LobbyPlayer host = new Lobby.LobbyPlayer();
        host.setUsername(principal.getName());
        host.setClan(user.getClan());
        host.setClanTag(user.getClanTag());
        host.setOwner(true);
        host.setAvatarColor(user.getAvatarColor());
        lobby.getPlayerList().add(host);

        lobbyRepository.save(lobby);
        return ResponseEntity.ok(toResponse(lobby));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinLobby(@PathVariable String id,
                                        @RequestBody(required = false) JoinLobbyRequest req,
                                        Principal principal) {
        Lobby lobby = lobbyRepository.findById(id).orElse(null);
        if (lobby == null) return ResponseEntity.notFound().build();
        if (lobby.isFull()) return ResponseEntity.badRequest().body(Map.of("error", "Sala llena."));
        if (lobby.getStatus() != Lobby.LobbyStatus.WAITING)
            return ResponseEntity.badRequest().body(Map.of("error", "La partida ya comenzó."));
        if (lobby.isHasPassword() && (req == null || !lobby.getPassword().equals(req.getPassword())))
            return ResponseEntity.status(403).body(Map.of("error", "Código incorrecto."));

        boolean alreadyIn = lobby.getPlayerList().stream()
                .anyMatch(p -> p.getUsername().equals(principal.getName()));
        if (!alreadyIn) {
            User user = userRepository.findByUsername(principal.getName()).orElseThrow();
            Lobby.LobbyPlayer p = new Lobby.LobbyPlayer();
            p.setUsername(principal.getName());
            p.setClan(user.getClan());
            p.setClanTag(user.getClanTag());
            p.setAvatarColor(user.getAvatarColor());
            lobby.getPlayerList().add(p);
            lobbyRepository.save(lobby);

            messagingTemplate.convertAndSend("/topic/lobby/" + id,
                Map.of("type", "PLAYER_JOINED", "username", principal.getName(),
                       "lobby", toResponse(lobby)));
        }
        return ResponseEntity.ok(toResponse(lobby));
    }

    @PostMapping("/{id}/ready")
    public ResponseEntity<?> toggleReady(@PathVariable String id, Principal principal) {
        Lobby lobby = lobbyRepository.findById(id).orElse(null);
        if (lobby == null) return ResponseEntity.notFound().build();

        lobby.getPlayerList().stream()
            .filter(p -> p.getUsername().equals(principal.getName()))
            .findFirst().ifPresent(p -> p.setStatus(
                p.getStatus() == Lobby.LobbyPlayer.PlayerStatus.READY
                    ? Lobby.LobbyPlayer.PlayerStatus.WAITING
                    : Lobby.LobbyPlayer.PlayerStatus.READY));

        lobbyRepository.save(lobby);
        messagingTemplate.convertAndSend("/topic/lobby/" + id,
            Map.of("type", "PLAYER_READY", "lobby", toResponse(lobby)));

        if (lobby.allReady())
            messagingTemplate.convertAndSend("/topic/lobby/" + id,
                Map.of("type", "GAME_STARTING", "message", "¡Todos listos!"));

        return ResponseEntity.ok(toResponse(lobby));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveLobby(@PathVariable String id, Principal principal) {
        Lobby lobby = lobbyRepository.findById(id).orElse(null);
        if (lobby == null) return ResponseEntity.notFound().build();

        if (lobby.getHost().equals(principal.getName())) {
            lobbyRepository.delete(lobby);
            messagingTemplate.convertAndSend("/topic/lobby/" + id,
                Map.of("type", "LOBBY_DELETED"));
        } else {
            lobby.getPlayerList().removeIf(p -> p.getUsername().equals(principal.getName()));
            lobbyRepository.save(lobby);
            messagingTemplate.convertAndSend("/topic/lobby/" + id,
                Map.of("type", "PLAYER_LEFT", "username", principal.getName(),
                       "lobby", toResponse(lobby)));
        }
        return ResponseEntity.ok().build();
    }

    private LobbyResponse toResponse(Lobby lobby) {
        LobbyResponse r = new LobbyResponse();
        r.setId(lobby.getId());
        r.setName(lobby.getName());
        r.setDescription(lobby.getDescription());
        r.setHost(lobby.getHost());
        r.setPlayers(lobby.getPlayerCount());
        r.setMaxPlayers(lobby.getMaxPlayers());
        r.setStatus(lobby.getStatus().name());
        r.setMode(lobby.getMode());
        r.setHasPassword(lobby.isHasPassword());
        r.setPlayerList(lobby.getPlayerList().stream().map(p -> {
            LobbyResponse.PlayerDto dto = new LobbyResponse.PlayerDto();
            dto.setUsername(p.getUsername());
            dto.setClan(p.getClan());
            dto.setClanTag(p.getClanTag());
            dto.setStatus(p.getStatus().name());
            dto.setOwner(p.isOwner());
            dto.setAvatarColor(p.getAvatarColor());
            return dto;
        }).toList());
        return r;
    }
}
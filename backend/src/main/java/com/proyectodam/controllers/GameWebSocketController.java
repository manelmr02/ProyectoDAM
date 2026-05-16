package com.proyectodam.controllers;

import com.proyectodam.model.game.GameState;
import com.proyectodam.model.mysql.Sala;
import com.proyectodam.repository.mysql.SalaRepository;
import com.proyectodam.service.GameService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final GameService gameService;
    private final SimpMessagingTemplate messaging;
    private final SalaRepository salaRepository;

    @Data
    public static class GameAction {
        private String type;   // JOIN, ATTACK, REINFORCE, END_TURN
        private String player; // acting player's name
        private String target; // target region key (player name) for ATTACK / REINFORCE
    }

    private void broadcast(String salaId, GameState state) {
        try {
            messaging.convertAndSend("/topic/partida/" + salaId, state);
        } catch (Exception ignored) {}
    }

    @MessageMapping("/partida/{id}/join")
    public void join(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.getState(id);
        if (state == null) {
            try {
                Optional<Sala> opt = salaRepository.findById(Long.parseLong(id));
                if (opt.isPresent()) {
                    state = gameService.initOrGet(id, opt.get().getJugadores());
                }
            } catch (NumberFormatException ignored) {}
        }
        if (state != null) {
            broadcast(id, state);
        }
    }

    @MessageMapping("/partida/{id}/attack")
    public void attack(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.attack(id, action.getPlayer(), action.getTarget());
        if (state != null) broadcast(id, state);
    }

    @MessageMapping("/partida/{id}/reinforce")
    public void reinforce(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.reinforce(id, action.getPlayer(), action.getTarget());
        if (state != null) broadcast(id, state);
    }

    @MessageMapping("/partida/{id}/endTurn")
    public void endTurn(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.endTurn(id, action.getPlayer());
        if (state != null) broadcast(id, state);
    }

    @MessageMapping("/partida/{id}/selectItem")
    public void selectItem(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.selectItem(id, action.getPlayer(), action.getTarget());
        if (state != null) broadcast(id, state);
    }

    @MessageMapping("/partida/{id}/surrender")
    public void surrender(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.surrender(id, action.getPlayer());
        if (state != null) broadcast(id, state);
    }

    @MessageMapping("/partida/{id}/ultimate")
    public void ultimate(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.ultimate(id, action.getPlayer(), action.getTarget());
        if (state != null) broadcast(id, state);
    }

    @MessageMapping("/partida/{id}/recall")
    public void recall(@DestinationVariable String id, GameAction action) {
        GameState state = gameService.recall(id, action.getPlayer());
        if (state != null) broadcast(id, state);
    }
}

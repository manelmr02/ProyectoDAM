package com.proyectodam.controller;

import com.proyectodam.model.Game.PlayerAction;
import com.proyectodam.service.GameService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    // Angular: stompClient.publish({ destination: '/app/game/{id}/action', body: JSON.stringify({...}) })
    @MessageMapping("/game/{gameId}/action")
    public void handleAction(@DestinationVariable String gameId,
                              @Payload Map<String, String> payload,
                              Principal principal) {
        PlayerAction action = new PlayerAction();
        action.setUsername(principal.getName());
        action.setAction(PlayerAction.ActionType.valueOf(payload.get("action")));
        action.setTargetUsername(payload.get("targetUsername"));

        log.debug("Acción: {} → {} en partida {}", principal.getName(), payload.get("action"), gameId);
        gameService.registerAction(gameId, principal.getName(), action);
    }

    @MessageMapping("/game/{gameId}/ready")
    public void playerReady(@DestinationVariable String gameId, Principal principal) {
        gameService.playerReadyForGame(gameId, principal.getName());
    }
}
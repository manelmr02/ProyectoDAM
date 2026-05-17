package com.proyectodam.controllers;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class LobbyWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sala/{id}/chat")
    public void handleChat(@DestinationVariable String id, ChatMessage message) {
        messagingTemplate.convertAndSend("/topic/sala/" + id + "/chat", message);
    }

    @Data
    public static class ChatMessage {
        private String sender;
        private String text;
        private String time;
    }
}

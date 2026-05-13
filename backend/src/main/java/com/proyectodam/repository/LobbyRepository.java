package com.proyectodam.repository;

import com.proyectodam.model.Lobby;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LobbyRepository extends MongoRepository<Lobby, String> {
    List<Lobby> findByStatus(Lobby.LobbyStatus status);
    List<Lobby> findByPlayerList_Username(String username);
}
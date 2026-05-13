package com.proyectodam.repository;

import com.proyectodam.model.Game;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GameRepository extends MongoRepository<Game, String> {
    Optional<Game> findByLobbyIdAndStatus(String lobbyId, Game.GameStatus status);
}
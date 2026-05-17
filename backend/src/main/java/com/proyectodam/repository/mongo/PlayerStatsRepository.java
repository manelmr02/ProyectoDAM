package com.proyectodam.repository.mongo;

import com.proyectodam.model.mongo.PlayerStats;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerStatsRepository extends MongoRepository<PlayerStats, String> {
    Optional<PlayerStats> findByUsername(String username);
    List<PlayerStats> findAllByOrderByLpDesc();
}

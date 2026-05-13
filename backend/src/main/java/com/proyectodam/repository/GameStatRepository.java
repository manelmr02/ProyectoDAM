package com.proyectodam.repository;

import com.proyectodam.model.GameStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameStatRepository extends JpaRepository<GameStat, Long> {

    List<GameStat> findByUsernameOrderByPlayedAtDesc(String username);

    @Query("SELECT gs.username, COUNT(gs), SUM(CASE WHEN gs.result = 'WIN' THEN 1 ELSE 0 END) " +
           "FROM GameStat gs GROUP BY gs.username " +
           "ORDER BY SUM(CASE WHEN gs.result = 'WIN' THEN 1 ELSE 0 END) DESC")
    List<Object[]> findRankingRaw();
}
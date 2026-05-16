package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RegionRepository extends JpaRepository<Region, Long> {
    List<Region> findByUsuarioId(String usuarioId);

    // RF-12: ranking por victorias descendente
    List<Region> findAllByOrderByVictoriasDesc();

    // RF-23/25: tipo de región con más victorias
    @Query("SELECT r.tipo, SUM(r.victorias) as total FROM Region r GROUP BY r.tipo ORDER BY total DESC")
    List<Object[]> findRankingPorTipo();
}
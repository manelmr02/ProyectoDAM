package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.Partida;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartidaRepository extends JpaRepository<Partida, Long> {
}
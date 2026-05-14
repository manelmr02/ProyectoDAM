package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.Participante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ParticipanteRepository extends JpaRepository<Participante, Long> {
    List<Participante> findByPartidaId(Long partidaId);
}
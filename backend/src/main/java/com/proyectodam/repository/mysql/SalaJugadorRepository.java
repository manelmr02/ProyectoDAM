package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.SalaJugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SalaJugadorRepository extends JpaRepository<SalaJugador, Long> {
    Optional<SalaJugador> findBySala_IdAndNombre(Long salaId, String nombre);
    void deleteBySala_IdAndNombre(Long salaId, String nombre);
}

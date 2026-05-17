package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.SalaJugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaJugadorRepository extends JpaRepository<SalaJugador, Long> {
    Optional<SalaJugador> findBySala_IdAndNombre(Long salaId, String nombre);
    List<SalaJugador> findBySala_Id(Long salaId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SalaJugador sj WHERE sj.sala.id = :salaId AND sj.nombre = :nombre")
    void deleteBySala_IdAndNombre(@Param("salaId") Long salaId, @Param("nombre") String nombre);
}

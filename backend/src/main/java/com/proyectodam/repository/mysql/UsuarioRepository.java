package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNickname(String nickname);

    Optional<Usuario> findByNicknameOrEmail(String nickname, String email);

    boolean existsByNickname(String nickname);

    boolean existsByEmail(String email);

    // RF-22: usuario con más victorias (suma de victorias de sus regiones)
    @Query("SELECT u FROM Usuario u JOIN u.regiones r GROUP BY u ORDER BY SUM(r.victorias) DESC")
    List<Usuario> findUsuariosOrdenadosPorVictorias();
}
package com.proyectodam.repository.mysql;

import com.proyectodam.model.mysql.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNickname(String nickname);
    boolean existsByNickname(String nickname);
    boolean existsByEmail(String email);
    Optional<Usuario> findByNicknameOrEmail(String nickname, String email);
    Optional<Usuario> findByEmail(String email);
}

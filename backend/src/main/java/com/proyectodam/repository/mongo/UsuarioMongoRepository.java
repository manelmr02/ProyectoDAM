package com.proyectodam.repository.mongo;

import com.proyectodam.model.mongo.UsuarioMongo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioMongoRepository extends MongoRepository<UsuarioMongo, String> {
    Optional<UsuarioMongo> findByNickname(String nickname);
    
    // Para evitar errores si hay duplicados antiguos
    Optional<UsuarioMongo> findFirstByNickname(String nickname);
    
    boolean existsByNickname(String nickname);
    boolean existsByEmail(String email);

    Optional<UsuarioMongo> findByNicknameOrEmail(String nickname, String email);
}

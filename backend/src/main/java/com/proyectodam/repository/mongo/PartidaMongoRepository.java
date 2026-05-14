package com.proyectodam.repository.mongo;

import com.proyectodam.model.mongo.PartidaMongo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PartidaMongoRepository extends MongoRepository<PartidaMongo, String> {
    List<PartidaMongo> findAllByOrderByCopiadaAtDesc();
}
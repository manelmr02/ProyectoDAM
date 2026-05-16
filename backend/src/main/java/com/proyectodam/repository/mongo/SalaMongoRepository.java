package com.proyectodam.repository.mongo;

import com.proyectodam.model.mongo.SalaMongo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaMongoRepository extends MongoRepository<SalaMongo, String> {
}

package com.proyectodam.model.mongo;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "usuarios")
public class UsuarioMongo {
    @Id
    private String id;
    
    private Long mysqlId; // Mantenemos esto por compatibilidad temporal si es necesario

    @Indexed(unique = true)
    private String nickname; // Cambiado de username a nickname para coincidir con MySQL

    @Indexed(unique = true)
    private String email;

    private String password;
    private String nombre;
    private String apellidos;
    private String clan;
    private int monedas;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    private String bio;
    private String avatarImage;
    private String avatarColor;
}

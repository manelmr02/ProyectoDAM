package com.proyectodam.model.mongo;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "partidas")
public class PartidaMongo {

    @Id
    private String id;

    private Long partidaId;       // ID de la partida en MySQL
    private String estado;
    private Integer numeroRonda;
    private Instant createdAt;
    private Instant copiadaAt = Instant.now();

    private List<ParticipanteMongo> participantes;

    @Data
    @NoArgsConstructor
    public static class ParticipanteMongo {
        private String usuarioId;
        private String nickname;
        private Long regionId;
        private String nombreRegion;
        private String tipoRegion;
        private Integer vida;
    }
}
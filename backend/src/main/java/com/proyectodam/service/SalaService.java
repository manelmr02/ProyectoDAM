package com.proyectodam.service;

import com.proyectodam.model.mongo.SalaMongo;
import com.proyectodam.repository.mongo.SalaMongoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalaService {

    private final SalaMongoRepository salaMongoRepository;

    public SalaMongo crearSala(SalaMongo salaMongoReq) {
        // Generamos un ID de 5 dígitos aleatorios que no se repita
        String randomId;
        do {
            randomId = String.valueOf((int) (Math.random() * 90000) + 10000);
        } while (salaMongoRepository.existsById(randomId));
        
        salaMongoReq.setId(randomId);
        salaMongoReq.setJugadores(new ArrayList<>());
        salaMongoReq.setEstado("LOBBY");
        
        // Si no es privada, nos aseguramos de que no tenga password
        if (!salaMongoReq.isEsPrivada()) {
            salaMongoReq.setPassword(null);
        }
        
        return salaMongoRepository.save(salaMongoReq);
    }

    public List<SalaMongo> listarSalas() {
        List<SalaMongo> salas = salaMongoRepository.findAll();
        // Ocultamos la contraseña en el listado por seguridad
        salas.forEach(s -> s.setPassword(s.isEsPrivada() ? "****" : null));
        return salas;
    }

    public SalaMongo obtenerSala(String id) {
        return salaMongoRepository.findById(id).orElse(null);
    }

    public void eliminarSala(String id) {
        salaMongoRepository.deleteById(id);
    }

    public SalaMongo unirseASala(String salaId, SalaMongo.ParticipanteSala participante, String password) {
        SalaMongo sala = obtenerSala(salaId);
        if (sala == null) return null;

        // Validar contraseña si es privada
        if (sala.isEsPrivada()) {
            if (sala.getPassword() == null || !sala.getPassword().equals(password)) {
                throw new RuntimeException("Código de acceso incorrecto");
            }
        }

        if (sala.getJugadores() == null) {
            sala.setJugadores(new ArrayList<>());
        }

        if (sala.getJugadores().size() < sala.getMaxJugadores()) {
            // Evitar duplicados por nombre
            sala.getJugadores().removeIf(p -> p.getNombre().equals(participante.getNombre()));
            sala.getJugadores().add(participante);
            return salaMongoRepository.save(sala);
        }
        return sala;
    }

    public SalaMongo salirDeSala(String salaId, String nombreUsuario) {
        SalaMongo sala = obtenerSala(salaId);
        if (sala != null) {
            sala.getJugadores().removeIf(p -> p.getNombre().equals(nombreUsuario));
            // Si la sala se queda vacía o el creador se va, la borramos
            if (sala.getJugadores().isEmpty() || sala.getCreador().equals(nombreUsuario)) {
                eliminarSala(salaId);
                return null;
            }
            return salaMongoRepository.save(sala);
        }
        return null;
    }

    public SalaMongo actualizarEstadoJugador(String salaId, String nombreUsuario, String estado) {
        SalaMongo sala = obtenerSala(salaId);
        if (sala != null) {
            for (SalaMongo.ParticipanteSala p : sala.getJugadores()) {
                if (p.getNombre().equals(nombreUsuario)) {
                    p.setStatus(estado);
                    break;
                }
            }
            return salaMongoRepository.save(sala);
        }
        return sala;
    }
}

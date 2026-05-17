package com.proyectodam.service;

import com.proyectodam.model.mysql.Sala;
import com.proyectodam.model.mysql.SalaJugador;
import com.proyectodam.repository.mysql.SalaJugadorRepository;
import com.proyectodam.repository.mysql.SalaRepository;
import com.proyectodam.repository.mysql.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SalaService {

    private final SalaRepository salaRepository;
    private final SalaJugadorRepository salaJugadorRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public Sala crearSala(Sala salaReq) {
        salaReq.setEstado("LOBBY");
        if (!salaReq.isEsPrivada()) {
            salaReq.setPassword(null);
        }
        return salaRepository.save(salaReq);
    }

    public List<Sala> listarSalas() {
        List<Sala> salas = salaRepository.findAll();
        salas.forEach(s -> s.setPassword(s.isEsPrivada() ? "****" : null));
        return salas;
    }

    public Sala obtenerSala(Long id) {
        return salaRepository.findById(id).orElse(null);
    }

    @Transactional
    public void eliminarSala(Long id) {
        salaRepository.deleteById(id);
    }

    @Transactional
    public Sala unirseASala(Long salaId, SalaJugador participante, String password) {
        Sala sala = obtenerSala(salaId);
        if (sala == null) return null;

        if (sala.isEsPrivada()) {
            if (sala.getPassword() == null || !sala.getPassword().equals(password)) {
                throw new RuntimeException("Código de acceso incorrecto");
            }
        }

        if (sala.getJugadores().size() < sala.getMaxJugadores()) {
            salaJugadorRepository.deleteBySala_IdAndNombre(salaId, participante.getNombre());
            // Populate avatar from the user's stored profile so the client never needs to send it
            usuarioRepository.findByNickname(participante.getNombre()).ifPresent(u -> {
                participante.setAvatarImage(u.getAvatarImage());
                if (participante.getAvatarColor() == null) {
                    participante.setAvatarColor(u.getAvatarColor());
                }
            });
            participante.setSala(sala);
            salaJugadorRepository.save(participante);
        }

        return salaRepository.findById(salaId).orElse(null);
    }

    @Transactional
    public Sala salirDeSala(Long salaId, String nombreUsuario) {
        Sala sala = obtenerSala(salaId);
        if (sala == null) return null;

        salaJugadorRepository.deleteBySala_IdAndNombre(salaId, nombreUsuario);

        sala = salaRepository.findById(salaId).orElse(null);
        if (sala == null) return null;

        if (sala.getJugadores().isEmpty() || sala.getCreador().equals(nombreUsuario)) {
            salaRepository.deleteById(salaId);
            return null;
        }
        return sala;
    }

    @Transactional
    public Sala actualizarEstadoJugador(Long salaId, String nombreUsuario, String estado) {
        salaJugadorRepository.findBySala_IdAndNombre(salaId, nombreUsuario)
                .ifPresent(j -> {
                    j.setStatus(estado);
                    salaJugadorRepository.save(j);
                });
        return salaRepository.findById(salaId).orElse(null);
    }

    @Transactional
    public Sala cambiarFaccion(Long salaId, String nombreUsuario, String faccion) {
        salaJugadorRepository.findBySala_IdAndNombre(salaId, nombreUsuario)
                .ifPresent(j -> {
                    j.setFaction(faccion);
                    salaJugadorRepository.save(j);
                });
        return salaRepository.findById(salaId).orElse(null);
    }
}

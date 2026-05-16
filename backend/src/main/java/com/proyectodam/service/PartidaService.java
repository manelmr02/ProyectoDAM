package com.proyectodam.service;

import com.proyectodam.controllers.PartidaController.*;
import com.proyectodam.exception.ResourceNotFoundException;
import com.proyectodam.model.mysql.*;
import com.proyectodam.repository.mysql.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PartidaService {

    private final PartidaRepository partidaRepository;
    private final ParticipanteRepository participanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegionRepository regionRepository;

    @Transactional
    public Partida guardarPartida(GuardarPartidaRequest req) {
        Partida partida = new Partida();
        partida.setEstado(req.getPartida().getEstado() != null
                ? req.getPartida().getEstado() : "EN_CURSO");
        partida.setNumeroRonda(req.getPartida().getNumeroRonda() != null
                ? req.getPartida().getNumeroRonda() : 1);
        partidaRepository.save(partida);

        for (ParticipanteDto dto : req.getParticipantes()) {
            if (!usuarioRepository.existsById(Long.parseLong(dto.getUsuario().getId()))) {
                throw new ResourceNotFoundException("Usuario no encontrado: " + dto.getUsuario().getId());
            }
            Region region = regionRepository.findById(Long.parseLong(dto.getRegion().getId()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Región no encontrada: " + dto.getRegion().getId()));

            Participante p = new Participante();
            p.setPartida(partida);
            p.setUsuarioId(dto.getUsuario().getId());
            p.setRegion(region);
            p.setVida(dto.getVida() != null ? dto.getVida() : 5);
            participanteRepository.save(p);
        }
        return partida;
    }

    @Transactional
    public Map<String, Object> finalizarPartida(Long idPartida, String idGanador, String idPerdedor) {
        Partida partida = partidaRepository.findById(idPartida)
                .orElseThrow(() -> new ResourceNotFoundException("Partida no encontrada: " + idPartida));
        Usuario ganador = usuarioRepository.findById(Long.parseLong(idGanador))
                .orElseThrow(() -> new ResourceNotFoundException("Ganador no encontrado: " + idGanador));
        Usuario perdedor = usuarioRepository.findById(Long.parseLong(idPerdedor))
                .orElseThrow(() -> new ResourceNotFoundException("Perdedor no encontrado: " + idPerdedor));

        partida.setEstado("FINALIZADO");
        partidaRepository.save(partida);

        ganador.setMonedas(ganador.getMonedas() + 200);
        perdedor.setMonedas(perdedor.getMonedas() + 50);
        usuarioRepository.save(ganador);
        usuarioRepository.save(perdedor);

        participanteRepository.findByPartidaId(idPartida).forEach(p -> {
            if (p.getUsuarioId().equals(idGanador)) {
                p.getRegion().setVictorias(p.getRegion().getVictorias() + 1);
            } else {
                p.getRegion().setVidas(Math.max(0, p.getRegion().getVidas() - 1));
            }
            regionRepository.save(p.getRegion());
        });

        return Map.of("message", "Partida finalizada correctamente.",
                      "ganador", ganador.getNickname(),
                      "monedas_ganador", ganador.getMonedas());
    }

    @Transactional
    public Map<String, String> finalizarConPosiciones(Long idPartida, List<JugadorPosicion> jugadores) {
        Partida partida = partidaRepository.findById(idPartida)
                .orElseThrow(() -> new ResourceNotFoundException("Partida no encontrada: " + idPartida));

        partida.setEstado("FINALIZADO");
        partidaRepository.save(partida);

        List<Participante> participantes = participanteRepository.findByPartidaId(idPartida);

        jugadores.forEach(jp -> {
            Usuario usuario = usuarioRepository.findById(Long.parseLong(jp.getIdJugador()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Usuario no encontrado: " + jp.getIdJugador()));

            int premio = Math.max(0, 500 - 50 * (jp.getPosicion() - 1));
            usuario.setMonedas(usuario.getMonedas() + premio);
            usuarioRepository.save(usuario);

            participantes.stream()
                .filter(p -> p.getUsuarioId().equals(jp.getIdJugador()))
                .findFirst()
                .ifPresent(p -> {
                    if (jp.getPosicion() == 1) {
                        p.getRegion().setVictorias(p.getRegion().getVictorias() + 1);
                    } else {
                        p.getRegion().setVidas(Math.max(0, p.getRegion().getVidas() - 1));
                    }
                    regionRepository.save(p.getRegion());
                });
        });

        return Map.of("message", "Partida finalizada con posiciones correctamente.");
    }

    @Transactional(readOnly = true)
    public List<Partida> listarPartidas() {
        return partidaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Partida getPartida(Long id) {
        return partidaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partida no encontrada: " + id));
    }
}

package com.proyectodam.service;

import com.proyectodam.model.mongo.PartidaMongo;
import com.proyectodam.model.mysql.Partida;
import com.proyectodam.model.mysql.Participante;
import com.proyectodam.repository.mongo.PartidaMongoRepository;
import com.proyectodam.repository.mysql.PartidaRepository;
import com.proyectodam.repository.mysql.ParticipanteRepository;
import com.proyectodam.repository.mysql.RegionRepository;
import com.proyectodam.repository.mysql.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EstadisticasService {

    private final PartidaRepository partidaRepository;
    private final ParticipanteRepository participanteRepository;
    private final PartidaMongoRepository partidaMongoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegionRepository regionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> copiarAMongo() {
        List<Partida> partidas = partidaRepository.findAll();
        int copiadas = 0;

        for (Partida partida : partidas) {
            boolean yaExiste = partidaMongoRepository
                    .findAllByOrderByCopiadaAtDesc().stream()
                    .anyMatch(p -> p.getPartidaId().equals(partida.getId()));
            if (yaExiste) continue;

            List<Participante> participantes =
                    participanteRepository.findByPartidaId(partida.getId());

            PartidaMongo pm = new PartidaMongo();
            pm.setPartidaId(partida.getId());
            pm.setEstado(partida.getEstado());
            pm.setNumeroRonda(partida.getNumeroRonda());
            pm.setCreatedAt(partida.getCreatedAt());
            pm.setParticipantes(participantes.stream().map(p -> {
                PartidaMongo.ParticipanteMongo pmo = new PartidaMongo.ParticipanteMongo();
                pmo.setUsuarioId(p.getUsuario().getId());
                pmo.setNickname(p.getUsuario().getNickname());
                pmo.setRegionId(p.getRegion().getId());
                pmo.setNombreRegion(p.getRegion().getNombre());
                pmo.setTipoRegion(p.getRegion().getTipo());
                pmo.setVida(p.getVida());
                return pmo;
            }).toList());

            partidaMongoRepository.save(pm);
            copiadas++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Copia completada.");
        result.put("partidasCopadas", copiadas);
        result.put("totalEnMongo", partidaMongoRepository.count());
        return result;
    }

    public List<PartidaMongo> listarPartidasMongo() {
        return partidaMongoRepository.findAllByOrderByCopiadaAtDesc();
    }

    public Map<String, Object> usuarioTop() {
        return usuarioRepository.findUsuariosOrdenadosPorVictorias()
                .stream().findFirst()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("nickname", u.getNickname());
                    map.put("victorias", u.getRegiones().stream()
                            .mapToInt(r -> r.getVictorias()).sum());
                    return map;
                })
                .orElseGet(() -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("message", "No hay datos aún.");
                    return map;
                });
    }

    public Map<String, Object> tipoRegionTop() {
        List<Object[]> ranking = regionRepository.findRankingPorTipo();
        Map<String, Object> map = new HashMap<>();
        if (ranking.isEmpty()) {
            map.put("message", "No hay datos aún.");
            return map;
        }
        map.put("tipo", ranking.get(0)[0]);
        map.put("totalVictorias", ranking.get(0)[1]);
        return map;
    }

    public List<Map<String, Object>> rankingUsuarios() {
        return usuarioRepository.findUsuariosOrdenadosPorVictorias().stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("nickname", u.getNickname());
                    map.put("monedas", u.getMonedas());
                    map.put("victorias", u.getRegiones().stream()
                            .mapToInt(r -> r.getVictorias()).sum());
                    return map;
                })
                .toList();
    }

    public List<Map<String, Object>> rankingTiposRegion() {
        return regionRepository.findRankingPorTipo().stream()
                .map(row -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("tipo", row[0]);
                    map.put("totalVictorias", row[1]);
                    return map;
                })
                .toList();
    }
}
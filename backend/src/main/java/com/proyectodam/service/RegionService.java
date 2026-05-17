package com.proyectodam.service;

import com.proyectodam.exception.BadRequestException;
import com.proyectodam.exception.ResourceNotFoundException;
import com.proyectodam.model.mysql.Region;
import com.proyectodam.model.mysql.Usuario;
import com.proyectodam.repository.mysql.RegionRepository;
import com.proyectodam.repository.mysql.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<Region> getRegionesDeUsuario(String usuarioId) {
        if (!usuarioRepository.existsById(Long.parseLong(usuarioId)))
            throw new ResourceNotFoundException("Usuario no encontrado: " + usuarioId);
        return regionRepository.findByUsuarioId(usuarioId);
    }

    @Transactional
    public Region comprarRegion(String usuarioId, String nombre, String tipo) {
        Usuario usuario = usuarioRepository.findById(Long.parseLong(usuarioId))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + usuarioId));

        int coste;
        try {
            coste = Region.getCostePorTipo(tipo);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }

        if (usuario.getMonedas() < coste)
            throw new BadRequestException("Monedas insuficientes. Necesitas " + coste
                    + " y tienes " + usuario.getMonedas() + ".");

        Region region = new Region();
        region.setNombre(nombre);
        region.setTipo(tipo);
        region.setVidas(5);
        region.setVictorias(0);
        region.setUsuarioId(usuarioId);

        usuario.setMonedas(usuario.getMonedas() - coste);
        usuarioRepository.save(usuario);
        return regionRepository.save(region);
    }

    @Transactional
    public Region crearRegion(String usuarioId, String nombre, String tipo) {
        if (!usuarioRepository.existsById(Long.parseLong(usuarioId)))
            throw new ResourceNotFoundException("Usuario no encontrado: " + usuarioId);

        Region region = new Region();
        region.setNombre(nombre);
        region.setTipo(tipo);
        region.setVidas(5);
        region.setVictorias(0);
        region.setUsuarioId(usuarioId);
        return regionRepository.save(region);
    }

    @Transactional(readOnly = true)
    public List<Region> listarTodas() {
        return regionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Region> ranking() {
        return regionRepository.findAllByOrderByVictoriasDesc();
    }

    @Transactional
    public Region actualizarRegion(Long id, Map<String, Object> updates) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Región no encontrada: " + id));

        if (updates.containsKey("nombre"))    region.setNombre((String) updates.get("nombre"));
        if (updates.containsKey("tipo"))      region.setTipo((String) updates.get("tipo"));
        if (updates.containsKey("vidas"))     region.setVidas((Integer) updates.get("vidas"));
        if (updates.containsKey("victorias")) region.setVictorias((Integer) updates.get("victorias"));

        return regionRepository.save(region);
    }

    @Transactional
    public void eliminarRegion(Long id) {
        if (!regionRepository.existsById(id))
            throw new ResourceNotFoundException("Región no encontrada: " + id);
        regionRepository.deleteById(id);
    }
}

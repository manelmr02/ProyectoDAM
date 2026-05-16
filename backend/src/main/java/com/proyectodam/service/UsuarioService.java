package com.proyectodam.service;

import com.proyectodam.exception.BadRequestException;
import com.proyectodam.exception.ResourceNotFoundException;
import com.proyectodam.model.mysql.Usuario;
import com.proyectodam.repository.mysql.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> crearUsuario(String nombre, String apellidos,
                                             String nickname, String password, String email) {
        if (usuarioRepository.existsByNickname(nickname))
            throw new BadRequestException("El nickname ya está en uso.");
        if (usuarioRepository.existsByEmail(email))
            throw new BadRequestException("El email ya está registrado.");

        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setNickname(nickname);
        u.setPassword(passwordEncoder.encode(password));
        u.setEmail(email);
        u.setMonedas(0);
        usuarioRepository.save(u);

        return Map.of("id", String.valueOf(u.getId()), "nickname", u.getNickname(),
                      "monedas", u.getMonedas(), "regiones", List.of());
    }

    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    public Usuario getUsuario(String id) {
        return usuarioRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }

    public Usuario actualizarUsuario(String id, Map<String, Object> updates) {
        Usuario u = getUsuario(id);

        if (updates.containsKey("nombre"))    u.setNombre((String) updates.get("nombre"));
        if (updates.containsKey("apellidos")) u.setApellidos((String) updates.get("apellidos"));
        if (updates.containsKey("monedas"))   u.setMonedas((Integer) updates.get("monedas"));

        if (updates.containsKey("email")) {
            String email = (String) updates.get("email");
            if (!email.equals(u.getEmail()) && usuarioRepository.existsByEmail(email))
                throw new BadRequestException("El email ya está en uso.");
            u.setEmail(email);
        }
        if (updates.containsKey("nickname")) {
            String nick = (String) updates.get("nickname");
            if (!nick.equals(u.getNickname()) && usuarioRepository.existsByNickname(nick))
                throw new BadRequestException("El nickname ya está en uso.");
            u.setNickname(nick);
        }
        if (updates.containsKey("password"))
            u.setPassword(passwordEncoder.encode((String) updates.get("password")));

        return usuarioRepository.save(u);
    }

    public void eliminarUsuario(String id) {
        long lid = Long.parseLong(id);
        if (!usuarioRepository.existsById(lid))
            throw new ResourceNotFoundException("Usuario no encontrado: " + id);
        usuarioRepository.deleteById(lid);
    }
}

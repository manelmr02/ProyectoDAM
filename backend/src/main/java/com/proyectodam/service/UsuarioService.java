package com.proyectodam.service;

import com.proyectodam.exception.BadRequestException;
import com.proyectodam.exception.ResourceNotFoundException;
import com.proyectodam.model.mongo.UsuarioMongo;
import com.proyectodam.repository.mongo.UsuarioMongoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioMongoRepository usuarioMongoRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> crearUsuario(String nombre, String apellidos,
                                             String nickname, String password, String email) {
        if (usuarioMongoRepository.existsByNickname(nickname))
            throw new BadRequestException("El nickname ya está en uso.");
        if (usuarioMongoRepository.existsByEmail(email))
            throw new BadRequestException("El email ya está registrado.");

        UsuarioMongo u = new UsuarioMongo();
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setNickname(nickname);
        u.setPassword(passwordEncoder.encode(password));
        u.setEmail(email);
        u.setMonedas(0);
        usuarioMongoRepository.save(u);

        return Map.of("id", u.getId(), "nickname", u.getNickname(),
                      "monedas", u.getMonedas(), "regiones", List.of());
    }

    public List<UsuarioMongo> listarUsuarios() {
        return usuarioMongoRepository.findAll();
    }

    public UsuarioMongo getUsuario(String id) {
        return usuarioMongoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }

    public UsuarioMongo actualizarUsuario(String id, Map<String, Object> updates) {
        UsuarioMongo u = getUsuario(id);

        if (updates.containsKey("nombre"))    u.setNombre((String) updates.get("nombre"));
        if (updates.containsKey("apellidos")) u.setApellidos((String) updates.get("apellidos"));
        if (updates.containsKey("monedas"))   u.setMonedas((Integer) updates.get("monedas"));

        if (updates.containsKey("email")) {
            String email = (String) updates.get("email");
            if (!email.equals(u.getEmail()) && usuarioMongoRepository.existsByEmail(email))
                throw new BadRequestException("El email ya está en uso.");
            u.setEmail(email);
        }
        if (updates.containsKey("nickname")) {
            String nick = (String) updates.get("nickname");
            if (!nick.equals(u.getNickname()) && usuarioMongoRepository.existsByNickname(nick))
                throw new BadRequestException("El nickname ya está en uso.");
            u.setNickname(nick);
        }
        if (updates.containsKey("password"))
            u.setPassword(passwordEncoder.encode((String) updates.get("password")));

        return usuarioMongoRepository.save(u);
    }

    public void eliminarUsuario(String id) {
        if (!usuarioMongoRepository.existsById(id))
            throw new ResourceNotFoundException("Usuario no encontrado: " + id);
        usuarioMongoRepository.deleteById(id);
    }
}
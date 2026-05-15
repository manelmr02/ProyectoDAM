package com.proyectodam.service;

import com.proyectodam.dto.AuthDtos;
import com.proyectodam.exception.BadRequestException;
import com.proyectodam.model.mysql.Usuario;
import com.proyectodam.repository.mysql.UsuarioRepository;
import com.proyectodam.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.nickname}")
    private String adminNickname;

    @Value("${app.admin.password}")
    private String adminPassword;

    public Map<String, String> login(String nickname, String password) {
        // RN-01.1 y RN-01.2
        if (!adminNickname.equals(nickname) || !adminPassword.equals(password))
            throw new BadRequestException("Acceso no autorizado.");

        String token = jwtService.generateToken(adminNickname);
        return Map.of("token", token, "message", "Middleware authenticated successfully");
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        if (usuarioRepository.existsByNickname(req.getUsername()))
            throw new BadRequestException("El nombre de usuario ya está en uso.");
        if (usuarioRepository.existsByEmail(req.getEmail()))
            throw new BadRequestException("El email ya está registrado.");

        Usuario usuario = new Usuario();
        usuario.setNombre(req.getUsername());
        usuario.setApellidos("");
        usuario.setNickname(req.getUsername());
        usuario.setEmail(req.getEmail());
        usuario.setPassword(passwordEncoder.encode(req.getPassword()));
        usuario.setClan(req.getClan() != null ? req.getClan() : "");

        usuario = usuarioRepository.save(usuario);

        String token = jwtService.generateToken(usuario.getNickname());

        AuthDtos.UserDto userDto = new AuthDtos.UserDto();
        userDto.setId(String.valueOf(usuario.getId()));
        userDto.setUsername(usuario.getNickname());
        userDto.setEmail(usuario.getEmail());
        userDto.setClan(usuario.getClan());
        userDto.setLevel(1);

        return new AuthDtos.AuthResponse(token, userDto);
    }
}
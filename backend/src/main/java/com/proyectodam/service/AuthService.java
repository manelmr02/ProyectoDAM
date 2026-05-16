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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.nickname:admin}")
    private String adminNickname;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    public AuthDtos.AuthResponse login(String usernameOrEmail, String password) {
        // 1. Intentar login Admin (Prioritario para que no falles)
        if (adminNickname.equals(usernameOrEmail) && adminPassword.equals(password)) {
            return createAdminResponse();
        }

        // 2. Intentar buscar en DB (Nickname o Email)
        Usuario usuario = usuarioRepository.findByNicknameOrEmail(usernameOrEmail, usernameOrEmail).orElse(null);

        if (usuario != null) {
            // COMPROBACIÓN RELAJADA: Aceptamos texto plano o BCrypt
            boolean matches = password.equals(usuario.getPassword()) || passwordEncoder.matches(password, usuario.getPassword());
            
            if (matches) {
                return createAuthResponse(usuario);
            }
        }

        throw new BadRequestException("Usuario o contraseña incorrectos.");
    }

    private AuthDtos.AuthResponse createAuthResponse(Usuario usuario) {
        String token = jwtService.generateToken(usuario.getNickname());
        AuthDtos.UserDto userDto = new AuthDtos.UserDto();
        userDto.setId(String.valueOf(usuario.getId()));
        userDto.setUsername(usuario.getNickname());
        userDto.setEmail(usuario.getEmail());
        userDto.setClan(usuario.getClan());
        userDto.setLevel(1);
        
        AuthDtos.UserStatsDto stats = new AuthDtos.UserStatsDto();
        stats.setWins(0);
        userDto.setStats(stats);

        return new AuthDtos.AuthResponse(token, userDto);
    }

    private AuthDtos.AuthResponse createAdminResponse() {
        String token = jwtService.generateToken(adminNickname);
        AuthDtos.UserDto adminDto = new AuthDtos.UserDto();
        adminDto.setId("0");
        adminDto.setUsername(adminNickname);
        adminDto.setEmail("admin@proyectodam.com");
        adminDto.setClan("ADMIN");
        adminDto.setLevel(99);
        return new AuthDtos.AuthResponse(token, adminDto);
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        Usuario usuario = new Usuario();
        usuario.setNombre(req.getUsername());
        usuario.setApellidos("");
        usuario.setNickname(req.getUsername());
        usuario.setEmail(req.getEmail());
        // Guardamos encriptado por seguridad, pero el login acepta ambos
        usuario.setPassword(passwordEncoder.encode(req.getPassword()));
        usuario = usuarioRepository.save(usuario);
        return createAuthResponse(usuario);
    }
}
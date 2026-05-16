package com.proyectodam.service;

import com.proyectodam.dto.AuthDtos;
import com.proyectodam.exception.BadRequestException;
import com.proyectodam.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.proyectodam.model.mongo.UsuarioMongo;
import com.proyectodam.repository.mongo.UsuarioMongoRepository;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final UsuarioMongoRepository usuarioMongoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.nickname:admin}")
    private String adminNickname;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    public AuthDtos.AuthResponse login(String usernameOrEmail, String password) {
        // 1. Intentar login Admin
        if (adminNickname.equals(usernameOrEmail) && adminPassword.equals(password)) {
            return createAdminResponse();
        }

        // 2. Buscar en MongoDB (Nickname o Email)
        UsuarioMongo usuario = usuarioMongoRepository.findByNickname(usernameOrEmail)
                .orElseGet(() -> usuarioMongoRepository.findByNicknameOrEmail("", usernameOrEmail).orElse(null));

        if (usuario != null) {
            if (passwordEncoder.matches(password, usuario.getPassword()) || password.equals(usuario.getPassword())) {
                return createAuthResponse(usuario);
            }
        }

        throw new BadRequestException("Usuario o contraseña incorrectos.");
    }

    private AuthDtos.AuthResponse createAuthResponse(UsuarioMongo usuario) {
        String token = jwtService.generateToken(usuario.getNickname());
        AuthDtos.UserDto userDto = new AuthDtos.UserDto();
        userDto.setId(usuario.getId());
        userDto.setUsername(usuario.getNickname());
        userDto.setEmail(usuario.getEmail());
        userDto.setClan(usuario.getClan());
        userDto.setAvatarColor(usuario.getAvatarColor());
        userDto.setAvatarImage(usuario.getAvatarImage());
        userDto.setBio(usuario.getBio());
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
        // Verificar si ya existe el usuario o el email en MongoDB
        if (usuarioMongoRepository.existsByNickname(req.getUsername())) {
            throw new BadRequestException("El nombre de usuario '" + req.getUsername() + "' ya está registrado.");
        }
        if (usuarioMongoRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("El email '" + req.getEmail() + "' ya está registrado.");
        }

        UsuarioMongo usuario = new UsuarioMongo();
        usuario.setNombre(req.getUsername());
        usuario.setApellidos("");
        usuario.setNickname(req.getUsername());
        usuario.setEmail(req.getEmail());
        usuario.setPassword(passwordEncoder.encode(req.getPassword()));
        usuario.setMonedas(0);
        usuario.setClan(req.getClan());
        
        // Asignar avatar por defecto
        usuario.setAvatarImage("");
        usuario.setAvatarColor("#" + Integer.toHexString(req.getUsername().hashCode()).substring(0, 6));

        usuario = usuarioMongoRepository.save(usuario);
        
        return createAuthResponse(usuario);
    }
}
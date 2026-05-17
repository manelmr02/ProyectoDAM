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
        if (adminNickname.equals(usernameOrEmail) && adminPassword.equals(password)) {
            return createAdminResponse();
        }

        Usuario usuario = usuarioRepository.findByNicknameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new BadRequestException("Usuario o contraseña incorrectos."));

        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            throw new BadRequestException("Usuario o contraseña incorrectos.");
        }

        return createAuthResponse(usuario);
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        if (usuarioRepository.existsByNickname(req.getUsername())) {
            throw new BadRequestException("El nombre de usuario '" + req.getUsername() + "' ya está registrado.");
        }
        if (usuarioRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("El email '" + req.getEmail() + "' ya está registrado.");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(req.getUsername());
        usuario.setApellidos("");
        usuario.setNickname(req.getUsername());
        usuario.setEmail(req.getEmail());
        usuario.setPassword(passwordEncoder.encode(req.getPassword()));
        usuario.setMonedas(0);
        usuario.setClan(req.getClan());
        usuario.setAvatarImage("");
        String hashHex = Integer.toHexString(Math.abs(req.getUsername().hashCode()));
        usuario.setAvatarColor("#" + hashHex.substring(0, Math.min(6, hashHex.length())));

        usuario = usuarioRepository.save(usuario);
        return createAuthResponse(usuario);
    }

    private AuthDtos.AuthResponse createAuthResponse(Usuario usuario) {
        String token = jwtService.generateToken(usuario.getNickname());
        AuthDtos.UserDto userDto = new AuthDtos.UserDto();
        userDto.setId(String.valueOf(usuario.getId()));
        userDto.setUsername(usuario.getNickname());
        userDto.setEmail(usuario.getEmail());
        userDto.setClan(usuario.getClan());
        userDto.setAvatarColor(usuario.getAvatarColor());
        userDto.setAvatarImage(usuario.getAvatarImage());
        userDto.setBio(usuario.getBio());
        userDto.setLevel(1);
        if (usuario.getCreatedAt() != null) {
            userDto.setCreatedAt(usuario.getCreatedAt().toString());
        }

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
}

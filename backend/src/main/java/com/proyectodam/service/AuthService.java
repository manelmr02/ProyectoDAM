package com.proyectodam.service;

import com.proyectodam.exception.BadRequestException;
import com.proyectodam.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;

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
}
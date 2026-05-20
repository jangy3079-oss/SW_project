package com.donga.dating.auth.controller;

import com.donga.dating.auth.dto.AuthRequestDto;
import com.donga.dating.auth.dto.AuthResponseDto;
import com.donga.dating.auth.exception.AuthException;
import com.donga.dating.auth.jwt.JwtProvider;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody AuthRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("유저를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("비밀번호가 올바르지 않습니다.");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        AuthResponseDto response = AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getUserId())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        String newAccessToken = jwtProvider.refreshAccessToken(refreshToken);

        String email = jwtProvider.validateAndGetSubject(newAccessToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("유저를 찾을 수 없습니다."));

        String newRefreshToken = jwtProvider.generateRefreshToken(user);

        AuthResponseDto response = AuthResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getUserId())
                .build();

        return ResponseEntity.ok(response);
    }
}

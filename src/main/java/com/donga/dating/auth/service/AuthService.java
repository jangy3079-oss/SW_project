package com.donga.dating.auth.service;

import com.donga.dating.auth.dto.AuthRequestDto;
import com.donga.dating.auth.dto.AuthResponseDto;
import com.donga.dating.auth.dto.TokenRefreshRequestDto;
import com.donga.dating.auth.exception.AuthException;
import com.donga.dating.auth.jwt.JwtProvider;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       JwtProvider jwtProvider,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponseDto login(AuthRequestDto request) {
        log.info("로그인 시도: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("유저 조회 실패: {}", request.getEmail());
                    return new AuthException("해당 이메일의 사용자를 찾을 수 없습니다.");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("비밀번호 불일치: {}", request.getEmail());
            throw new AuthException("비밀번호가 올바르지 않습니다.");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        log.info("로그인 성공: {}", request.getEmail());
        return new AuthResponseDto(accessToken, refreshToken, user.getEmail(), user.getName());
    }

    public AuthResponseDto refreshToken(TokenRefreshRequestDto request) {
        log.info("토큰 재발급 시도");

        if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            log.error("Refresh Token 누락");
            throw new AuthException("Refresh Token이 제공되지 않았습니다.");
        }

        String newAccessToken = jwtProvider.refreshAccessToken(request.getRefreshToken());

        log.info("토큰 재발급 성공");
        return new AuthResponseDto(newAccessToken, request.getRefreshToken(), null, null);
    }
}

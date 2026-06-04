package com.donga.dating.auth.controller;

import com.donga.dating.auth.dto.AuthRequestDto;
import com.donga.dating.auth.dto.AuthResponseDto;
import com.donga.dating.auth.exception.AuthException;
import com.donga.dating.auth.jwt.JwtProvider;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /** 로그인 */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody AuthRequestDto request,
                                                 HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("유저를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("비밀번호가 올바르지 않습니다.");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        // Refresh Token을 HttpOnly 쿠키에 저장
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7일
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // Access Token은 바디로 내려줌
        AuthResponseDto responseDto = AuthResponseDto.builder()
                .accessToken(accessToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getUserId())
                .build();

        return ResponseEntity.ok(responseDto);
    }

    /** Refresh Token으로 Access Token 갱신 */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDto> refresh(@CookieValue("refreshToken") String refreshToken,
                                                   HttpServletResponse response) {
        String newAccessToken = jwtProvider.refreshAccessToken(refreshToken);
        String email = jwtProvider.validateAndGetSubject(newAccessToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("유저를 찾을 수 없습니다."));

        String newRefreshToken = jwtProvider.generateRefreshToken(user);

        // 새 Refresh Token을 쿠키에 갱신
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", newRefreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        AuthResponseDto responseDto = AuthResponseDto.builder()
                .accessToken(newAccessToken)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getUserId())
                .build();

        return ResponseEntity.ok(responseDto);
    }
}

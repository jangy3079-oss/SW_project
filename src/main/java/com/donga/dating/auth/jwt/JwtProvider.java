package com.donga.dating.auth.jwt;

import com.donga.dating.domain.user.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {
    private static final Logger log = LoggerFactory.getLogger(JwtProvider.class);

    private final Key secretKey;
    private final long accessTokenValidity;
    private final long refreshTokenValidity;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity}") long accessTokenValidity,
            @Value("${jwt.refresh-token-validity}") long refreshTokenValidity
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
    }

    public String generateAccessToken(User user) {
        log.info("generateAccessToken 호출: userId={}, email={}, name={}",
                user.getUserId(), user.getEmail(), user.getName());

        return Jwts.builder()
                .setSubject(user.getEmail())
                .claim("role", "USER") // 기본 USER 권한 부여
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenValidity))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(User user) {
        log.info("generateRefreshToken 호출: userId={}, email={}, name={}",
                user.getUserId(), user.getEmail(), user.getName());

        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenValidity))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String refreshAccessToken(String refreshToken) {
        try {
            log.info("refreshAccessToken 호출: {}", refreshToken);

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(refreshToken)
                    .getBody();

            if (claims.getExpiration().before(new Date())) {
                throw new JwtException("Refresh Token이 만료되었습니다.");
            }

            User user = User.builder()
                    .email(claims.getSubject())
                    .build();

            log.info("Refresh Token 검증 성공: {}", user.getEmail());

            return generateAccessToken(user);

        } catch (JwtException e) {
            log.error("Refresh Token 검증 실패: {}", e.getMessage());
            throw new JwtException("Refresh Token 검증 실패: " + e.getMessage());
        }
    }

    public String validateAndGetSubject(String token) {
        try {
            log.info("validateAndGetSubject 호출: {}", token);

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            if (claims.getExpiration().before(new Date())) {
                throw new JwtException("Access Token이 만료되었습니다.");
            }

            log.info("Access Token 검증 성공: {}", claims.getSubject());
            return claims.getSubject();
        } catch (JwtException e) {
            log.error("Access Token 검증 실패: {}", e.getMessage());
            throw new JwtException("Access Token 검증 실패: " + e.getMessage());
        }
    }


    public String getRole(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.get("role", String.class);
        } catch (JwtException e) {
            log.error("Role 추출 실패: {}", e.getMessage());
            throw new JwtException("Role 추출 실패: " + e.getMessage());
        }
    }
}

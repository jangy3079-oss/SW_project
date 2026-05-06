package com.donga.dating.domain.user.controller;

import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [사용자 API]
 * POST   /api/users/register  - 회원가입 (로그인 담당자 구현)
 * POST   /api/users/login     - 로그인   (로그인 담당자 구현)
 * GET    /api/users/{id}      - 프로필 조회
 * PATCH  /api/users/{id}/bio  - 자기소개 수정
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    // TODO: 로직 구현
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

package com.donga.dating.domain.user.controller;

import com.donga.dating.domain.user.dto.RegisterRequest;
import com.donga.dating.domain.user.service.UserService;
import com.donga.dating.global.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [사용자 API]
 * - 회원가입 / 로그인 / 프로필 조회 / 자기소개 수정
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 회원가입 API
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(
            @RequestBody RegisterRequest request
    ) throws Exception{

        userService.register(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 로그인 (현재 미구현)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login() {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 유저 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> getUser(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
package com.donga.dating.domain.user.controller;

import com.donga.dating.domain.user.dto.ProfileDtos.BioUpdateRequest;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileResponse;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileUpsertRequest;
import com.donga.dating.domain.user.service.UserService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [사용자 API]
 * POST   /api/users/register   - 회원가입 (로그인 담당자 구현)
 * POST   /api/users/login      - 로그인   (로그인 담당자 구현)
 * GET    /api/users/{id}       - 프로필 조회
 * POST   /api/users/{id}/profile - 프로필 등록/수정
 * PATCH  /api/users/{id}/bio   - 자기소개 수정
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userId)));
    }

    @PostMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> upsertProfile(
            @PathVariable Long userId,
            @RequestBody ProfileUpsertRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.upsertProfile(userId, request)));
    }

    @PatchMapping("/{userId}/bio")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateBio(
            @PathVariable Long userId,
            @RequestBody BioUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateBio(userId, request)));
    }
}

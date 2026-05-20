package com.donga.dating.domain.user.controller;

import com.donga.dating.domain.user.dto.ProfileDtos.BioUpdateRequest;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileResponse;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileUpsertRequest;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileWithPhotosResponse;
import com.donga.dating.domain.user.dto.PreferenceDtos;
import com.donga.dating.domain.user.dto.PreferenceDtos.PreferencesResponse;
import com.donga.dating.domain.user.dto.PreferenceDtos.PreferencesUpdateRequest;
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
 * GET    /api/users/{id}/profile-with-photos - 프로필 + 사진 통합 조회 (프론트용)
 * POST   /api/users/{id}/profile - 프로필 등록/수정
 * PATCH  /api/users/{id}/bio   - 자기소개 수정
 * GET    /api/users/{id}/preferences - 취향/태그 조회
 * PUT    /api/users/{id}/preferences - 취향/태그 수정
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

    @GetMapping("/{userId}/profile-with-photos")
    public ResponseEntity<ApiResponse<ProfileWithPhotosResponse>> getProfileWithPhotos(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfileWithPhotos(userId)));
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

    @GetMapping("/{userId}/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> getPreferences(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getPreferences(userId)));
    }

    @PutMapping("/{userId}/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> updatePreferences(
            @PathVariable Long userId,
            @RequestBody PreferencesUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updatePreferences(userId, request)));
    }
}

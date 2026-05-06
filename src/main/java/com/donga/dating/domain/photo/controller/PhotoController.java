package com.donga.dating.domain.photo.controller;

import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * [사진 API]
 * POST   /api/users/{userId}/photos             - 사진 업로드 (최대 5장)
 * GET    /api/users/{userId}/photos             - 사진 목록 조회
 * PATCH  /api/users/{userId}/photos/{photoId}/primary - 대표 사진 변경
 * DELETE /api/users/{userId}/photos/{photoId}   - 사진 삭제
 */
@RestController
@RequestMapping("/api/users/{userId}/photos")
@RequiredArgsConstructor
public class PhotoController {

    // TODO: PhotoService 주입 및 로직 구현
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> uploadPhoto(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Void>> getPhotos(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{photoId}/primary")
    public ResponseEntity<ApiResponse<Void>> setPrimary(
            @PathVariable Long userId,
            @PathVariable Long photoId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable Long userId,
            @PathVariable Long photoId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

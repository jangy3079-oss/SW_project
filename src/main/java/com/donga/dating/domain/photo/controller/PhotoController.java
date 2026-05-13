package com.donga.dating.domain.photo.controller;

import com.donga.dating.domain.photo.dto.UserPhotoResponse;
import com.donga.dating.domain.photo.entity.UserPhoto;
import com.donga.dating.domain.photo.service.PhotoService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * [사진 API]
 * POST   /api/users/{userId}/photos              - 사진 업로드 (최대 5장)
 * GET    /api/users/{userId}/photos              - 사진 목록 조회
 * GET    /api/users/{userId}/photos/{photoId}/view - 사진 조회
 * PATCH  /api/users/{userId}/photos/{photoId}/primary - 대표 사진 변경
 * DELETE /api/users/{userId}/photos/{photoId}    - 사진 삭제
 */
@RestController
@RequestMapping("/api/users/{userId}/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserPhotoResponse>> uploadPhoto(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        UserPhoto photo = photoService.uploadPhoto(userId, file);
        return ResponseEntity.ok(ApiResponse.success(UserPhotoResponse.from(photo)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserPhotoResponse>>> getPhotos(@PathVariable Long userId) {
        List<UserPhotoResponse> responses = photoService.getPhotos(userId).stream()
                .map(UserPhotoResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{photoId}/view")
    public ResponseEntity<byte[]> viewPhoto(
            @PathVariable Long userId,
            @PathVariable Long photoId) {
        UserPhoto photo = photoService.getPhotoForView(userId, photoId);
        byte[] imageBytes = photoService.loadPhotoBytes(photo);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .contentType(photoService.resolveMediaType(photo))
                .body(imageBytes);
    }

    @PatchMapping("/{photoId}/primary")
    public ResponseEntity<ApiResponse<Void>> setPrimary(
            @PathVariable Long userId,
            @PathVariable Long photoId) {
        photoService.setPrimaryPhoto(userId, photoId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable Long userId,
            @PathVariable Long photoId) {
        photoService.deletePhoto(userId, photoId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

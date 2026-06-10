package com.donga.dating.domain.user.controller;

import com.donga.dating.domain.user.dto.PreferenceDtos;
import com.donga.dating.domain.user.dto.RegisterRequest;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.service.UserService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * [사용자 API]
 * - 회원가입 / 이메일 인증 / 프로필 조회 / 자기소개 수정 / 선호도 조회·수정
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {


    private final UserService userService;

    /** 회원가입 */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공! 이메일 인증을 완료해주세요."));
    }

    /** 이메일 인증 */
    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verify(@RequestParam("token") String token) {
        boolean result = userService.verifyToken(token);
        if (result) {
            return ResponseEntity.ok(ApiResponse.success("이메일 인증이 완료되었습니다."));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("인증 실패"));
        }
    }

    /** 인증 메일 재발송 */
    @PostMapping("/resend-token")
    public ResponseEntity<ApiResponse<String>> resendToken(@RequestParam String email) {
        userService.resendVerificationToken(email);
        return ResponseEntity.ok(ApiResponse.success("새 인증 메일을 발송했습니다."));
    }

    /** 유저 조회 */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> getUser(@PathVariable Long userId) {
        User user = userService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /** 자기소개 수정 */
    @PatchMapping("/{userId}/bio")
    public ResponseEntity<ApiResponse<String>> updateBio(@PathVariable Long userId,
                                                         @RequestBody Map<String, String> body) {
        userService.updateBio(userId, body.get("bio"));
        return ResponseEntity.ok(ApiResponse.success("자기소개가 수정되었습니다."));
    }

    /** 프로필 공개 여부 수정 */
    @PatchMapping("/{userId}/active")
    public ResponseEntity<ApiResponse<String>> updateActive(@PathVariable Long userId,
                                                            @RequestParam Boolean isActive) {
        userService.updateActive(userId, isActive);
        return ResponseEntity.ok(ApiResponse.success("프로필 공개 상태가 변경되었습니다."));
    }

    /** 선호도 조회 */
    @GetMapping("/{userId}/preferences")
    public ResponseEntity<ApiResponse<PreferenceDtos.PreferencesResponse>> getPreferences(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getPreferences(userId)));
    }

    /** 선호도 수정 */
    @PutMapping("/{userId}/preferences")
    public ResponseEntity<ApiResponse<String>> updatePreferences(@PathVariable Long userId,
                                                                 @RequestBody PreferenceDtos.PreferencesUpdateRequest request) {
        userService.updatePreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("선호도가 업데이트되었습니다."));
    }
}
package com.donga.dating.domain.user.controller;

import com.donga.dating.domain.user.dto.RegisterRequest;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.service.UserService;
import com.donga.dating.global.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<String>> register(@RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입 성공! 이메일 인증을 완료해주세요."));
    }

    /**
     * 이메일 인증 API
     */
    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verify(@RequestParam("token") String token) {
        boolean result = userService.verifyToken(token);
        if (result) {
            return ResponseEntity.ok(ApiResponse.success("이메일 인증이 완료되었습니다."));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("인증 실패"));
        }
    }


    /**
     * 토큰 재발급 API
     */
    @PostMapping("/resend-token")
    public ResponseEntity<ApiResponse<String>> resendToken(@RequestParam String email) {
        userService.resendVerificationToken(email);
        return ResponseEntity.ok(ApiResponse.success("새 인증 메일을 발송했습니다."));
    }

    /**
     * 유저 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> getUser(@PathVariable Long userId) {
        User user = userService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/{userId}/active")
    public ResponseEntity<ApiResponse<String>> updateActive(@PathVariable Long userId,
                                                            @RequestParam Boolean isActive) {
        userService.updateActive(userId, isActive);
        return ResponseEntity.ok(ApiResponse.success("프로필 공개 상태가 변경되었습���다."));
    }
}
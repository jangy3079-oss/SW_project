package com.donga.dating.domain.matching.controller;

import com.donga.dating.domain.matching.service.UserLikeService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class UserLikeController {

    private final UserLikeService userLikeService;

    /** 사용자가 다른 사용자에게 좋아요를 보냅니다. */
    @PostMapping("/like")
    public ResponseEntity<ApiResponse<Void>> like(@RequestParam Long fromUserId, @RequestParam Long toUserId) {
        userLikeService.like(fromUserId, toUserId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

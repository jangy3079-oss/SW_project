package com.donga.dating.domain.like.controller;

import com.donga.dating.domain.like.dto.LikeResponse;
import com.donga.dating.domain.like.service.LikeService;
import com.donga.dating.domain.matching.dto.MatchResponse;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {
    private final LikeService likeService;

    /** 하트 보내기 */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<LikeResponse>> sendHeart(
            @RequestParam Long senderId,
            @RequestParam Long receiverId) {
        LikeResponse response = likeService.sendHeart(senderId, receiverId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** 하트 수락 → 매칭 생성 */
    @PostMapping("/accept")
    public ResponseEntity<ApiResponse<MatchResponse>> acceptHeart(@RequestParam Long likeId) {
        MatchResponse response = likeService.acceptHeart(likeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** 하트 거절 */
    @PostMapping("/reject")
    public ResponseEntity<ApiResponse<LikeResponse>> rejectHeart(@RequestParam Long likeId) {
        LikeResponse response = likeService.rejectHeart(likeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

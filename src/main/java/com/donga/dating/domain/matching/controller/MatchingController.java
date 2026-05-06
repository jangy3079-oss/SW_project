package com.donga.dating.domain.matching.controller;

import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [매칭 API]
 * POST   /api/matching/general/enter   - 일반 매칭 대기열 등록
 * DELETE /api/matching/general/cancel  - 일반 매칭 대기 취소
 * POST   /api/matching/rank/enter      - 랭크 매칭 대기열 등록
 * DELETE /api/matching/rank/cancel     - 랭크 매칭 대기 취소
 * GET    /api/matching/active          - 현재 활성 매칭 조회
 * GET    /api/matching/history         - 매칭 이력 조회
 */
@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    // TODO: MatchingService 주입 및 로직 구현
    @PostMapping("/general/enter")
    public ResponseEntity<ApiResponse<Void>> enterGeneral(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/rank/enter")
    public ResponseEntity<ApiResponse<Void>> enterRank(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/general/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelGeneral(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/rank/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelRank(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Void>> getActiveMatches(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Void>> getHistory(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

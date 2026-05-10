package com.donga.dating.domain.matching.controller;

import com.donga.dating.domain.matching.dto.EnterQueueResponse;
import com.donga.dating.domain.matching.dto.MatchResponse;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.service.MatchingService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * [매칭 API]
 * POST   /api/matching/general/enter   - 일반 매칭 대기열 등록 (즉시 매칭 or 대기)
 * DELETE /api/matching/general/cancel  - 일반 매칭 대기 취소
 * POST   /api/matching/rank/enter      - 랭크 매칭 대기열 등록 (즉시 매칭 or 대기)
 * DELETE /api/matching/rank/cancel     - 랭크 매칭 대기 취소
 * GET    /api/matching/active          - 현재 활성 매칭 조회
 * GET    /api/matching/history         - 매칭 이력 조회
 */
@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    /** 일반 매칭 대기열 등록 */
    @PostMapping("/general/enter")
    public ResponseEntity<ApiResponse<EnterQueueResponse>> enterGeneral(@RequestParam Long userId) {
        return matchingService.enterQueue(userId, Match.MatchType.GENERAL)
                .map(match -> ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.matched(match, userId))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.queued(Match.MatchType.GENERAL))));
    }

    /** 일반 매칭 대기 취소 */
    @DeleteMapping("/general/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelGeneral(@RequestParam Long userId) {
        matchingService.cancelQueue(userId, Match.MatchType.GENERAL);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 랭크 매칭 대기열 등록 */
    @PostMapping("/rank/enter")
    public ResponseEntity<ApiResponse<EnterQueueResponse>> enterRank(@RequestParam Long userId) {
        return matchingService.enterQueue(userId, Match.MatchType.RANK)
                .map(match -> ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.matched(match, userId))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.queued(Match.MatchType.RANK))));
    }

    /** 랭크 매칭 대기 취소 */
    @DeleteMapping("/rank/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelRank(@RequestParam Long userId) {
        matchingService.cancelQueue(userId, Match.MatchType.RANK);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 현재 활성 매칭 조회 */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getActiveMatches(@RequestParam Long userId) {
        List<MatchResponse> result = matchingService.getActiveMatches(userId)
                .stream()
                .map(m -> MatchResponse.from(m, userId))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** 매칭 이력 조회 */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<MatchResponse>>> getHistory(@RequestParam Long userId) {
        List<MatchResponse> result = matchingService.getMatchHistory(userId)
                .stream()
                .map(m -> MatchResponse.from(m, userId))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}

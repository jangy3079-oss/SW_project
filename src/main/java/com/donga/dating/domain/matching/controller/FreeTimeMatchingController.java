package com.donga.dating.domain.matching.controller;

import com.donga.dating.domain.matching.dto.FreeTimeRequestResponse;
import com.donga.dating.domain.matching.service.FreeTimeMatchingService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * [공강 매칭 API]
 * GET  /api/matching/freetime/pending            - 수락 대기 중인 공강 요청 목록
 * POST /api/matching/freetime/{requestId}/accept - 수락 → matches 테이블에 ACTIVE 매칭 생성
 * POST /api/matching/freetime/{requestId}/reject - 거절
 * POST /api/matching/freetime/test/run           - [테스트용] 자정 스케줄러 즉시 실행
 */
@RestController
@RequestMapping("/api/matching/freetime")
@RequiredArgsConstructor
public class FreeTimeMatchingController {

    private final FreeTimeMatchingService freeTimeMatchingService;

    /** 수락 대기 중인 공강 매칭 요청 목록 */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<FreeTimeRequestResponse>>> getPendingRequests(
            @RequestParam Long userId) {

        List<FreeTimeRequestResponse> result = freeTimeMatchingService.getPendingRequests(userId)
                .stream()
                .map(r -> FreeTimeRequestResponse.from(r, userId))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** 공강 매칭 수락 */
    @PostMapping("/{requestId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptRequest(
            @RequestParam Long userId,
            @PathVariable Long requestId) {

        freeTimeMatchingService.acceptRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 공강 매칭 거절 */
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @RequestParam Long userId,
            @PathVariable Long requestId) {

        freeTimeMatchingService.rejectRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * [테스트 전용] 자정 스케줄러를 즉시 실행
     * - 내일 날짜 기준으로 공강 매칭 요청 생성
     * - 실제 운영 시 이 엔드포인트는 제거 or 관리자 권한 처리 필요
     */
    @PostMapping("/test/run")
    public ResponseEntity<ApiResponse<String>> runMatchingNow() {
        freeTimeMatchingService.runDailyFreeTimeMatching();
        return ResponseEntity.ok(ApiResponse.success("공강 매칭 스케줄러 실행 완료"));
    }
}

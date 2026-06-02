package com.donga.dating.domain.matching.controller;

import com.donga.dating.domain.matching.dto.EnterQueueResponse;
import com.donga.dating.domain.matching.dto.MatchResponse;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.service.MatchingService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;

    /** 일반 매칭 대기열 등록 */
    @PostMapping("/general/enter")
    public ResponseEntity<ApiResponse<EnterQueueResponse>> enterGeneral(@RequestParam Long userId) {
        matchingService.enterQueue(userId, Match.MatchType.GENERAL);
        return ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.queued(Match.MatchType.GENERAL)));
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
        matchingService.enterQueue(userId, Match.MatchType.RANK);
        return ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.queued(Match.MatchType.RANK)));
    }

    /** 랭크 매칭 대기 취소 */
    @DeleteMapping("/rank/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelRank(@RequestParam Long userId) {
        matchingService.cancelQueue(userId, Match.MatchType.RANK);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 공강 매칭 대기열 등록 */
    @PostMapping("/lecture/enter")
    public ResponseEntity<ApiResponse<EnterQueueResponse>> enterLecture(
            @RequestParam Long userId,
            @RequestParam DayOfWeek lectureDay,
            @RequestParam LocalTime lectureStartTime,
            @RequestParam LocalTime lectureEndTime) {
        matchingService.enterQueue(userId, Match.MatchType.LECTURE,
                lectureDay, lectureStartTime, lectureEndTime);
        return ResponseEntity.ok(ApiResponse.success(EnterQueueResponse.queued(Match.MatchType.LECTURE)));
    }

    /** 공강 매칭 대기 취소 */
    @DeleteMapping("/lecture/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelLecture(@RequestParam Long userId) {
        matchingService.cancelQueue(userId, Match.MatchType.LECTURE);
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

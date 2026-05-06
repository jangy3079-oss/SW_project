package com.donga.dating.domain.evaluation.controller;

import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [평가 API]
 * POST /api/matches/{matchId}/evaluation  - 상대 평가 제출 (score: 1~5)
 */
@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class EvaluationController {

    // TODO: EvaluationService 주입 및 로직 구현
    @PostMapping("/{matchId}/evaluation")
    public ResponseEntity<ApiResponse<Void>> evaluate(
            @PathVariable Long matchId,
            @RequestParam Long evaluatorId,
            @RequestParam int score) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

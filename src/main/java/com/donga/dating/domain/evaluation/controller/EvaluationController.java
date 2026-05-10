package com.donga.dating.domain.evaluation.controller;

import com.donga.dating.domain.evaluation.dto.EvaluationResponse;
import com.donga.dating.domain.evaluation.entity.Evaluation;
import com.donga.dating.domain.evaluation.service.EvaluationService;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * [평가 API]
 * POST /api/matches/{matchId}/evaluation  - 상대 평가 제출 (score: 1~5)
 *   파라미터: evaluatorId (Long), score (int)
 *   - 매칭 참여자만 제출 가능
 *   - 동일 매칭에서 중복 제출 불가
 *   - 양방향 평가 완료 시 DB 트리거가 matches.status = EVALUATED 로 변경
 */
@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping("/{matchId}/evaluation")
    public ResponseEntity<ApiResponse<EvaluationResponse>> evaluate(
            @PathVariable Long matchId,
            @RequestParam Long evaluatorId,
            @RequestParam int score) {
        Evaluation evaluation = evaluationService.submitEvaluation(evaluatorId, matchId, score);
        return ResponseEntity.ok(ApiResponse.success(EvaluationResponse.from(evaluation)));
    }
}

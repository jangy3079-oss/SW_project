package com.donga.dating.domain.evaluation.dto;

import com.donga.dating.domain.evaluation.entity.Evaluation;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EvaluationResponse {

    private Long evaluationId;
    private Long matchId;
    private Long evaluatedId;
    private int score;
    private LocalDateTime createdAt;

    public static EvaluationResponse from(Evaluation evaluation) {
        return EvaluationResponse.builder()
                .evaluationId(evaluation.getEvaluationId())
                .matchId(evaluation.getMatch().getMatchId())
                .evaluatedId(evaluation.getEvaluated().getUserId())
                .score(evaluation.getScore())
                .createdAt(evaluation.getCreatedAt())
                .build();
    }
}

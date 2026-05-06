package com.donga.dating.domain.evaluation.service;

import com.donga.dating.domain.evaluation.entity.Evaluation;
import com.donga.dating.domain.evaluation.repository.EvaluationRepository;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    /**
     * 상대 평가 제출.
     * DB 트리거(trg_update_rank_after_eval, trg_match_evaluated)가
     * rank_score / rank_tier / match.status 를 자동 갱신한다.
     */
    @Transactional
    public Evaluation submitEvaluation(Long evaluatorId, Long matchId, int score) {
        if (score < 1 || score > 5) {
            throw new CustomException(ErrorCode.INVALID_SCORE);
        }

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        if (match.getStatus() != Match.MatchStatus.ACTIVE) {
            throw new CustomException(ErrorCode.MATCH_ALREADY_CLOSED);
        }

        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 평가자가 해당 매칭의 참여자인지 확인
        if (!match.getMaleUser().getUserId().equals(evaluatorId)
                && !match.getFemaleUser().getUserId().equals(evaluatorId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        // 중복 평가 방지
        if (evaluationRepository.existsByMatch_MatchIdAndEvaluator_UserId(matchId, evaluatorId)) {
            throw new CustomException(ErrorCode.ALREADY_EVALUATED);
        }

        // 피평가자 = 매칭 상대방
        Long evaluatedId = match.getMaleUser().getUserId().equals(evaluatorId)
                ? match.getFemaleUser().getUserId()
                : match.getMaleUser().getUserId();

        User evaluated = userRepository.findById(evaluatedId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return evaluationRepository.save(Evaluation.builder()
                .match(match)
                .evaluator(evaluator)
                .evaluated(evaluated)
                .score((byte) score)
                .build());
    }
}

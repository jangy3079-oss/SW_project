package com.donga.dating.domain.evaluation.repository;

import com.donga.dating.domain.evaluation.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 평가 Repository
 */
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    /**
     * 기존 메서드 (호환성 유지)
     */
    boolean existsByMatch_MatchIdAndEvaluator_UserId(Long matchId, Long evaluatorId);

    int countByMatch_MatchId(Long matchId);

    @Query("SELECT AVG(e.score) FROM Evaluation e WHERE e.evaluated.userId = :userId")
    Optional<Double> findAvgScoreByEvaluatedId(Long userId);

    /**
     * 새 구현에 필요한 메서드
     */
    @Query("SELECT AVG(CAST(e.score AS double)) FROM Evaluation e WHERE e.evaluated.userId = :evaluatedId")
    double getAverageScoreForUser(@Param("evaluatedId") Long evaluatedId);

    /**
     * 사용자가 받은 평가 건수
     */
    long countByEvaluated_UserId(Long evaluatedId);

    Optional<Evaluation> findByEvaluator_UserIdAndEvaluated_UserId(Long evaluatorId, Long evaluatedId);

    /**
     * 호환 메서드
     */
    default Optional<Evaluation> findByEvaluatorIdAndEvaluatedId(Long evaluatorId, Long evaluatedId) {
        return findByEvaluator_UserIdAndEvaluated_UserId(evaluatorId, evaluatedId);
    }

    default Optional<Evaluation> findByEvaluatorAndTarget(Long evaluatorId, Long evaluatedId) {
        return findByEvaluator_UserIdAndEvaluated_UserId(evaluatorId, evaluatedId);
    }

    default long countByEvaluatedId(Long evaluatedId) {
        return countByEvaluated_UserId(evaluatedId);
    }
}

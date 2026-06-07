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
    Optional<Evaluation> findByEvaluatorIdAndEvaluatedId(Long evaluatorId, Long evaluatedId);

    /**
     * 사용자가 받은 평가의 평균 점수
     */
    @Query("SELECT AVG(CAST(e.score AS DOUBLE)) FROM Evaluation e WHERE e.evaluatedId = :evaluatedId")
    double getAverageScoreForUser(@Param("evaluatedId") Long evaluatedId);

    /**
     * 사용자가 받은 평가 건수
     */
    long countByEvaluatedId(Long evaluatedId);

    /**
     * 호환 메서드
     */
    default Optional<Evaluation> findByEvaluatorAndTarget(Long evaluatorId, Long evaluatedId) {
        return findByEvaluatorIdAndEvaluatedId(evaluatorId, evaluatedId);
    }
}

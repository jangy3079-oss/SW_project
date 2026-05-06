package com.donga.dating.domain.evaluation.repository;

import com.donga.dating.domain.evaluation.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    boolean existsByMatch_MatchIdAndEvaluator_UserId(Long matchId, Long evaluatorId);

    int countByMatch_MatchId(Long matchId);

    @Query("SELECT AVG(e.score) FROM Evaluation e WHERE e.evaluated.userId = :userId")
    Optional<Double> findAvgScoreByEvaluatedId(Long userId);
}

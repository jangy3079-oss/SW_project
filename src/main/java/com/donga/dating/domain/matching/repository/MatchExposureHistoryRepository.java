package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.MatchExposureHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 매칭 노출 이력 (중복 노출 방지)
 */
@Repository
public interface MatchExposureHistoryRepository extends JpaRepository<MatchExposureHistory, Long> {

    /**
     * 특정 발신자가 특정 대상에게 이미 노출한 이력이 있는지 확인 (7일 이내)
     *
     * @param sourceUserId 발신자 ID
     * @param targetUserId 대상 ID
     * @param matchType 매칭 타입
     * @return 유효한 노출 이력이 있으면 true
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END " +
           "FROM MatchExposureHistory e " +
           "WHERE e.sourceUserId = :sourceUserId " +
           "  AND e.targetUserId = :targetUserId " +
           "  AND e.matchType = :matchType " +
           "  AND e.expiresAt > CURRENT_TIMESTAMP")
    boolean existsValidExposure(@Param("sourceUserId") Long sourceUserId,
                                @Param("targetUserId") Long targetUserId,
                                @Param("matchType") String matchType);

    /**
     * 만료된 노출 이력 모두 조회 및 삭제용
     */
    @Query("SELECT e FROM MatchExposureHistory e " +
           "WHERE e.expiresAt <= CURRENT_TIMESTAMP")
    List<MatchExposureHistory> findExpiredExposures();

    /**
     * 특정 사용자의 유효한 노출 이력 조회
     */
    @Query("SELECT e FROM MatchExposureHistory e " +
           "WHERE e.sourceUserId = :sourceUserId " +
           "  AND e.expiresAt > CURRENT_TIMESTAMP")
    List<MatchExposureHistory> findValidExposuresByUser(@Param("sourceUserId") Long sourceUserId);
}


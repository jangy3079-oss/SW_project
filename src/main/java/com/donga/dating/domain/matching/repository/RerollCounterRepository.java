package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.RerollCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 남성 사용자 리롤 횟수 관리 Repository
 */
@Repository
public interface RerollCounterRepository extends JpaRepository<RerollCounter, Long> {

    /**
     * 특정 사용자의 리롤 카운터 조회
     */
    Optional<RerollCounter> findByUserId(Long userId);

    /**
     * 오늘 초기화되지 않은 리롤 카운터 조회 (배치용)
     */
    @Query("SELECT r FROM RerollCounter r " +
           "WHERE r.resetDate < CURRENT_DATE")
    List<RerollCounter> findNeedsReset();

    /**
     * 특정 날짜에 리셋된 리롤 카운터들
     */
    @Query("SELECT r FROM RerollCounter r WHERE r.resetDate = :resetDate")
    List<RerollCounter> findByResetDate(@Param("resetDate") LocalDate resetDate);

    /**
     * 배치: 모든 리롤 카운터 오늘 초기화 (3으로 설정)
     */
    @Modifying
    @Transactional
    @Query("UPDATE RerollCounter r " +
           "SET r.remainingRerolls = 3, " +
           "    r.resetDate = CURRENT_DATE, " +
           "    r.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE r.resetDate < CURRENT_DATE")
    void resetAllForToday();
}


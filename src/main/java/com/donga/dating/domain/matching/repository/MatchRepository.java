package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {

    /** 특정 유저가 포함된 활성 매칭 조회 */
    @Query("SELECT m FROM Match m WHERE (m.maleUser.userId = :userId OR m.femaleUser.userId = :userId) AND m.status = 'ACTIVE'")
    List<Match> findActiveMatchesByUserId(Long userId);

    /** 특정 유저의 매칭 이력 */
    @Query("SELECT m FROM Match m WHERE m.maleUser.userId = :userId OR m.femaleUser.userId = :userId ORDER BY m.matchedAt DESC")
    List<Match> findMatchHistoryByUserId(Long userId);
}

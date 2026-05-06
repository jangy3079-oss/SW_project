package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.entity.MatchQueue;
import com.donga.dating.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchQueueRepository extends JpaRepository<MatchQueue, Long> {

    Optional<MatchQueue> findByUser_UserIdAndMatchTypeAndStatus(
            Long userId, Match.MatchType matchType, MatchQueue.QueueStatus status);

    /** 대기 중인 상대방 (다른 성별) 조회 — FIFO 순 */
    List<MatchQueue> findByMatchTypeAndStatusAndUser_GenderOrderByEnteredAtAsc(
            Match.MatchType matchType, MatchQueue.QueueStatus status, User.Gender gender);
}

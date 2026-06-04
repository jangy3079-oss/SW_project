package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.entity.MatchQueue;
import com.donga.dating.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface MatchQueueRepository extends JpaRepository<MatchQueue, Long> {

    Optional<MatchQueue> findByUser_UserIdAndMatchTypeAndStatus(
            Long userId, Match.MatchType matchType, MatchQueue.QueueStatus status);

    /** 대기 중인 상대방 (다른 성별) 조회 — FIFO 순 */
    List<MatchQueue> findByMatchTypeAndStatusAndUser_GenderOrderByEnteredAtAsc(
            Match.MatchType matchType, MatchQueue.QueueStatus status, User.Gender gender);

    @Query("""
    SELECT mq FROM MatchQueue mq
    WHERE mq.matchType = :matchType
      AND mq.status = :status
      AND mq.user.gender = :gender
      AND mq.lectureDay = :lectureDay
      AND mq.lectureStartTime <= :endTime
      AND mq.lectureEndTime >= :startTime
    ORDER BY mq.enteredAt ASC
""")
    List<MatchQueue> findLectureCandidates(
            @Param("matchType") Match.MatchType matchType,
            @Param("status") MatchQueue.QueueStatus status,
            @Param("gender") User.Gender gender,
            @Param("lectureDay") DayOfWeek lectureDay,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

}

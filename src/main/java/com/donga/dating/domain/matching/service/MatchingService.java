package com.donga.dating.domain.matching.service;

import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.entity.MatchQueue;
import com.donga.dating.domain.matching.repository.MatchQueueRepository;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    private final MatchRepository matchRepository;
    private final MatchQueueRepository queueRepository;
    private final UserRepository userRepository;

    /** 일반 매칭 큐 등록 */
    @Transactional
    public void enterQueue(Long userId, com.donga.dating.domain.matching.entity.Match.MatchType matchType) {
        enterQueue(userId, matchType, null, null, null);
    }

    /** 공강 매칭 큐 등록 */
    @Transactional
    public void enterQueue(Long userId,
                           com.donga.dating.domain.matching.entity.Match.MatchType matchType,
                           DayOfWeek lectureDay,
                           LocalTime lectureStartTime,
                           LocalTime lectureEndTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 이미 대기 중인지 확인
        queueRepository.findByUser_UserIdAndMatchTypeAndStatus(userId, matchType, MatchQueue.QueueStatus.WAITING)
                .ifPresent(q -> { throw new CustomException(ErrorCode.ALREADY_IN_QUEUE); });

        // 대기열 등록 (매칭은 하지 않음)
        MatchQueue queue = MatchQueue.builder()
                .user(user)
                .matchType(matchType)
                .lectureDay(lectureDay)
                .lectureStartTime(lectureStartTime)
                .lectureEndTime(lectureEndTime)
                .build();
        queueRepository.save(queue);
    }

    /** 대기열 취소 */
    @Transactional
    public void cancelQueue(Long userId, com.donga.dating.domain.matching.entity.Match.MatchType matchType) {
        MatchQueue queue = queueRepository
                .findByUser_UserIdAndMatchTypeAndStatus(userId, matchType, MatchQueue.QueueStatus.WAITING)
                .orElseThrow(() -> new CustomException(ErrorCode.QUEUE_NOT_FOUND));
        queue.cancel();
    }

    /** 후보군 조회 */
    public List<MatchQueue> getWaitingOpposites(com.donga.dating.domain.matching.entity.Match.MatchType matchType,
                                                User.Gender gender) {
        return queueRepository.findByMatchTypeAndStatusAndUser_GenderOrderByEnteredAtAsc(
                matchType, MatchQueue.QueueStatus.WAITING, gender);
    }

    public List<Match> getActiveMatches(Long userId) {
        return matchRepository.findActiveMatchesByUserId(userId);
    }

    public List<Match> getMatchHistory(Long userId) {
        return matchRepository.findMatchHistoryByUserId(userId);
    }

}

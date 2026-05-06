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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchingService {

    private static final int MATCH_VALID_HOURS = 48;   // 매칭 평가 유효 기간

    private final MatchRepository matchRepository;
    private final MatchQueueRepository queueRepository;
    private final UserRepository userRepository;

    /**
     * 매칭 대기열 등록.
     * 반대 성별 대기자가 있으면 즉시 매칭, 없으면 대기.
     */
    @Transactional
    public Optional<Match> enterQueue(Long userId, Match.MatchType matchType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 이미 대기 중인지 확인
        queueRepository.findByUser_UserIdAndMatchTypeAndStatus(userId, matchType, MatchQueue.QueueStatus.WAITING)
                .ifPresent(q -> { throw new CustomException(ErrorCode.ALREADY_IN_QUEUE); });

        User.Gender oppositeGender = (user.getGender() == User.Gender.MALE)
                ? User.Gender.FEMALE : User.Gender.MALE;

        List<MatchQueue> waitingOpposites = queueRepository
                .findByMatchTypeAndStatusAndUser_GenderOrderByEnteredAtAsc(
                        matchType, MatchQueue.QueueStatus.WAITING, oppositeGender);

        // 랭크 매칭: 동일 tier 우선, 인접 tier 허용
        if (matchType == Match.MatchType.RANK) {
            waitingOpposites = filterByRankTier(user, waitingOpposites);
        }

        if (!waitingOpposites.isEmpty()) {
            MatchQueue opponent = waitingOpposites.get(0);
            return Optional.of(createMatch(user, opponent.getUser(), matchType, opponent));
        }

        // 대기열 등록
        MatchQueue queue = MatchQueue.builder()
                .user(user)
                .matchType(matchType)
                .build();
        queueRepository.save(queue);
        return Optional.empty();
    }

    /**
     * 대기열 취소.
     */
    @Transactional
    public void cancelQueue(Long userId, Match.MatchType matchType) {
        MatchQueue queue = queueRepository
                .findByUser_UserIdAndMatchTypeAndStatus(userId, matchType, MatchQueue.QueueStatus.WAITING)
                .orElseThrow(() -> new CustomException(ErrorCode.QUEUE_NOT_FOUND));
        queue.cancel();
    }

    public List<Match> getActiveMatches(Long userId) {
        return matchRepository.findActiveMatchesByUserId(userId);
    }

    public List<Match> getMatchHistory(Long userId) {
        return matchRepository.findMatchHistoryByUserId(userId);
    }

    // ── private ─────────────────────────────────

    private Match createMatch(User requester, User opponent,
                               Match.MatchType matchType, MatchQueue opponentQueue) {
        User male   = requester.getGender() == User.Gender.MALE ? requester : opponent;
        User female = requester.getGender() == User.Gender.FEMALE ? requester : opponent;

        opponentQueue.matched();

        return matchRepository.save(Match.builder()
                .maleUser(male)
                .femaleUser(female)
                .matchType(matchType)
                .expiresAt(LocalDateTime.now().plusHours(MATCH_VALID_HOURS))
                .build());
    }

    private List<MatchQueue> filterByRankTier(User user, List<MatchQueue> candidates) {
        User.RankTier myTier = user.getRankTier();
        // 동일 tier → 인접 tier(상하 1단계) 순으로 필터
        List<MatchQueue> same = candidates.stream()
                .filter(q -> q.getUser().getRankTier() == myTier).toList();
        if (!same.isEmpty()) return same;

        return candidates.stream()
                .filter(q -> Math.abs(q.getUser().getRankTier().ordinal() - myTier.ordinal()) <= 1)
                .toList();
    }
}

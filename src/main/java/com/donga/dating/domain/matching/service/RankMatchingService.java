package com.donga.dating.domain.matching.service;

import com.donga.dating.domain.chat.service.ChatService;
import com.donga.dating.domain.matching.entity.*;
import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.repository.LikeRepository;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.integration.support.locks.LockRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;

/**
 * 실시간 랭크 매칭 서비스
 *
 * 알고리즘:
 * 1. 사용자가 큐 진입
 * 2. rankScore 기반 매칭 대상 탐색 (점수 ±100 범위)
 * 3. 1분마다 범위 확장 (±50씩)
 * 4. 최대 ±500점까지 확장, 5분 초과 시 타임아웃
 * 5. 매칭 성사 후 60초 내 양측 수락 필요
 * 6. 거절 시 24시간 블록리스트 추가 및 재진입
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankMatchingService {

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final MatchRepository matchRepository;
    private final ChatService chatService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final LockRegistry lockRegistry;

    // Redis 키 프리픽스
    private static final String RANK_QUEUE_PREFIX = "rank:queue:";
    private static final String RANK_BLOCK_LIST_PREFIX = "rank:block:";
    private static final String RANK_MATCH_ATTEMPT_PREFIX = "rank:match-attempt:";

    /**
     * 랭크 매칭 큐에 진입
     *
     * @param userId 사용자 ID
     */
    @Transactional
    public void enterRankQueue(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String queueKey = RANK_QUEUE_PREFIX + user.getGender().name();
        String userKey = "user:" + userId;

        // 1. Redis 큐에 사용자 추가 (진입 시각 포함)
        String userInfo = userId + ":" + System.currentTimeMillis() + ":" +
                         user.getRankScore() + ":" + Math.ceil(user.getRankScore().doubleValue() / 100.0);

        redisTemplate.opsForSet().add(queueKey, userInfo);
        log.info("[랭크 큐] 사용자 {} 진입 (점수: {})", userId, user.getRankScore());

        // 2. 즉시 매칭 시도
        tryMatchFromQueue(userId, user.getGender());
    }

    /**
     * 랭크 매칭 큐에서 탈출
     *
     * @param userId 사용자 ID
     * @param gender 성별
     */
    @Transactional
    public void exitRankQueue(Long userId, User.Gender gender) {
        String queueKey = RANK_QUEUE_PREFIX + gender.name();

        // Redis 큐에서 제거
        Set<Object> queueMembers = redisTemplate.opsForSet().members(queueKey);
        if (queueMembers != null) {
            Optional<Object> userEntry = queueMembers.stream()
                    .filter(entry -> entry.toString().startsWith(userId + ":"))
                    .findFirst();

            userEntry.ifPresent(entry -> redisTemplate.opsForSet().remove(queueKey, entry));
            log.info("[랭크 큐] 사용자 {} 탈출", userId);
        }
    }

    /**
     * 큐에서 매칭 시도 (점수 대역폭 기반)
     *
     * @param userId 사용자 ID
     * @param gender 사용자 성별
     */
    @Transactional
    public void tryMatchFromQueue(Long userId, User.Gender gender) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        User.Gender oppositeGender = gender == User.Gender.MALE ? User.Gender.FEMALE : User.Gender.MALE;
        String oppositeQueueKey = RANK_QUEUE_PREFIX + oppositeGender.name();

        // 1. 이성 큐 조회
        Set<Object> oppositeQueue = redisTemplate.opsForSet().members(oppositeQueueKey);
        if (oppositeQueue == null || oppositeQueue.isEmpty()) {
            log.debug("[랭크 매칭] 이성 대기자 없음");
            return;
        }

        // 2. 진입 후 경과 시간 계산 (1분마다 범위 확장)
        long currentTimeMs = System.currentTimeMillis();
        int windowSize = calculateScoreWindow(userId);

        // 3. 점수 범위 내 매칭 대상 탐색
        List<Long> candidates = findMatchCandidates(oppositeQueue, user.getRankScore(), windowSize);

        if (candidates.isEmpty()) {
            log.debug("[랭크 매칭] 점수 범위 내 매칭 대상 없음 (범위: ±{})", windowSize);
            return;
        }

        // 4. 첫 번째 후보와 매칭 시도
        Long candidateId = candidates.get(0);
        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 5. 블록리스트 확인 (24시간 내 거절한 상대는 제외)
        if (isBlocked(userId, candidateId)) {
            log.debug("[랭크 매칭] 사용자 {}와 {}는 블록리스트 상태", userId, candidateId);
            return;
        }

        // 6. 좋아요 생성 (양방향)
        createMutualLikeForRankMatching(userId, candidateId);
    }

    /**
     * 경과 시간에 따른 점수 대역폭 계산
     *
     * @param userId 사용자 ID
     * @return 점수 범위 (±점)
     */
    private int calculateScoreWindow(Long userId) {
        String attemptKey = RANK_MATCH_ATTEMPT_PREFIX + userId;
        Long enteredAt = (Long) redisTemplate.opsForValue().get("rank:entry:" + userId);

        if (enteredAt == null) {
            enteredAt = System.currentTimeMillis();
            redisTemplate.opsForValue().set("rank:entry:" + userId, enteredAt, Duration.ofMinutes(10));
        }

        long elapsedMs = System.currentTimeMillis() - enteredAt;
        long elapsedMinutes = elapsedMs / 60000;

        // 기본값: ±100, 1분마다 ±50 증가, 최대 ±500
        int windowSize = 100 + (int) (elapsedMinutes * 50);
        if (windowSize > 500) {
            windowSize = 500;
        }

        // 5분(300초) 초과 시 타임아웃
        if (elapsedMs > 300000) {
            exitRankQueue(userId, userRepository.findById(userId).get().getGender());
            throw new CustomException(ErrorCode.RANK_MATCHING_TIMEOUT);
        }

        log.debug("[점수 윈도우] 사용자 {}: 경과 {}분, 범위 ±{}", userId, elapsedMinutes, windowSize);
        return windowSize;
    }

    /**
     * 점수 범위 내 매칭 대상 탐색
     *
     * @param oppositeQueue 이성 큐 정보
     * @param myScore 내 rankScore
     * @param windowSize 점수 범위
     * @return 매칭 가능한 상대 ID 목록
     */
    private List<Long> findMatchCandidates(Set<Object> oppositeQueue, BigDecimal myScore, int windowSize) {
        double myScoreDouble = myScore.doubleValue();
        double minScore = myScoreDouble - windowSize;
        double maxScore = myScoreDouble + windowSize;

        return oppositeQueue.stream()
                .map(Object::toString)
                .map(entry -> entry.split(":"))
                .filter(parts -> {
                    if (parts.length < 3) return false;
                    try {
                        double scoreDouble = Double.parseDouble(parts[2]);
                        return scoreDouble >= minScore && scoreDouble <= maxScore;
                    } catch (NumberFormatException e) {
                        return false;
                    }
                })
                .map(parts -> Long.parseLong(parts[0]))
                .limit(1)
                .collect(Collectors.toList());
    }

    /**
     * 블록리스트 확인 (24시간 내 거절한 상대는 제외)
     */
    private boolean isBlocked(Long userId, Long targetId) {
        String blockKey = RANK_BLOCK_LIST_PREFIX + userId + ":" + targetId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(blockKey));
    }

    /**
     * 랭크 매칭 양방향 좋아요 생성
     */
    @Transactional
    private void createMutualLikeForRankMatching(Long userId1, Long userId2) {
        // 분산 락
        String lockKey = "like-rank:" + Math.min(userId1, userId2) + ":" + Math.max(userId1, userId2);
        Lock lock = lockRegistry.obtain(lockKey);

        if (!lock.tryLock()) {
            throw new CustomException(ErrorCode.CONCURRENT_REQUEST_FAILED);
        }

        try {
            // 양방향 좋아요 생성
            createLikeIfNotExists(userId1, userId2);
            createLikeIfNotExists(userId2, userId1);

            // 60초 내 수락 타임아웃 설정
            setRankMatchingAcceptanceTimeout(userId1, userId2);

            log.info("[랭크 매칭] {} ↔ {} 매칭 성사", userId1, userId2);

        } finally {
            lock.unlock();
        }
    }

    /**
     * 좋아요 생성 (중복 방지)
     */
    private void createLikeIfNotExists(Long senderId, Long receiverId) {
        Optional<Like> existing = likeRepository.findBySenderIdAndReceiverId(senderId, receiverId);

        if (existing.isEmpty()) {
            com.donga.dating.domain.user.entity.User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
            com.donga.dating.domain.user.entity.User receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

            Like like = Like.builder()
                    .sender(sender)
                    .receiver(receiver)
                    .status(Like.Status.PENDING)
                    .expiresAt(LocalDateTime.now().plusSeconds(60))  // 60초 타임아웃
                    .build();

            likeRepository.save(like);
        }
    }

    /**
     * 랭크 매칭 수락 타임아웃 설정 (60초)
     */
    private void setRankMatchingAcceptanceTimeout(Long userId1, Long userId2) {
        String timeoutKey = "rank:acceptance:" + userId1 + ":" + userId2;
        redisTemplate.opsForValue().set(timeoutKey, "pending", Duration.ofSeconds(60));
    }

    /**
     * 랭크 매칭 수락
     *
     * @param userId 수락자 ID
     * @param senderId 발신자 ID
     */
    @Transactional
    public void acceptRankMatching(Long userId, Long senderId) {
        String lockKey = "accept-rank:" + Math.min(userId, senderId) + ":" + Math.max(userId, senderId);
        Lock lock = lockRegistry.obtain(lockKey);

        if (!lock.tryLock()) {
            throw new CustomException(ErrorCode.CONCURRENT_REQUEST_FAILED);
        }

        try {
            Like like = likeRepository.findBySenderIdAndReceiverId(senderId, userId)
                    .orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

            if (like.getStatus() != Like.Status.PENDING) {
                throw new CustomException(ErrorCode.LIKE_ALREADY_PROCESSED);
            }

            like.accept();
            likeRepository.save(like);

            Optional<Like> reverseLike = likeRepository.findBySenderIdAndReceiverId(userId, senderId);
            if (reverseLike.isPresent() && reverseLike.get().getStatus() == Like.Status.ACCEPTED) {
                completeRankMatch(userId, senderId);
            }

            log.info("[랭크 매칭 수락] {} 수락", userId);
        } finally {
            lock.unlock();
        }
    }

    /**
     * 양측 수락 완료 시 Match 생성 및 채팅방 개설
     */
    private void completeRankMatch(Long userId1, Long userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (!isProfileActive(user1) || !isProfileActive(user2)) {
            throw new CustomException(ErrorCode.PROFILE_NOT_ACTIVE);
        }

        if (hasActiveRankMatchBetween(userId1, userId2)) {
            log.warn("[랭크 매칭] {} ↔ {} 기존 활성 매칭 존재 (중복 생성 방지)", userId1, userId2);
            return;
        }

        User male = user1.getGender() == User.Gender.MALE ? user1 : user2;
        User female = user1.getGender() == User.Gender.FEMALE ? user1 : user2;

        Match match = Match.builder()
                .maleUser(male)
                .femaleUser(female)
                .matchType(Match.MatchType.RANK)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();

        matchRepository.save(match);
        chatService.createChatRoomForMatch(match);

        rejectOtherPendingLikes(userId1, userId2);
        rejectOtherPendingLikes(userId2, userId1);

        exitRankQueue(userId1, user1.getGender());
        exitRankQueue(userId2, user2.getGender());

        clearRankAcceptanceTimeout(userId1, userId2);

        log.info("[랭크 매칭 수락] {} ↔ {} 양측 수락 완료, matchId={}", userId1, userId2, match.getMatchId());
    }

    private boolean isProfileActive(User user) {
        return user.getIsActive() != null && user.getIsActive();
    }

    private boolean hasActiveRankMatchBetween(Long userId1, Long userId2) {
        return matchRepository.findActiveMatchesByUserId(userId1).stream()
                .anyMatch(match -> match.getMatchType() == Match.MatchType.RANK
                        && isPartner(match, userId2));
    }

    private boolean isPartner(Match match, Long userId) {
        return match.getMaleUser().getUserId().equals(userId)
                || match.getFemaleUser().getUserId().equals(userId);
    }

    private void rejectOtherPendingLikes(Long userId, Long partnerId) {
        likeRepository.findBySender_UserIdAndStatus(userId, Like.Status.PENDING).stream()
                .filter(like -> !partnerId.equals(like.getReceiverId()))
                .forEach(Like::reject);

        likeRepository.findByReceiver_UserIdAndStatus(userId, Like.Status.PENDING).stream()
                .filter(like -> !partnerId.equals(like.getSenderId()))
                .forEach(Like::reject);
    }

    private void clearRankAcceptanceTimeout(Long userId1, Long userId2) {
        redisTemplate.delete("rank:acceptance:" + userId1 + ":" + userId2);
        redisTemplate.delete("rank:acceptance:" + userId2 + ":" + userId1);
    }

    /**
     * 랭크 매칭 거절
     *
     * @param userId 거절자 ID
     * @param senderId 발신자 ID
     */
    @Transactional
    public void rejectRankMatching(Long userId, Long senderId) {
        Like like = likeRepository.findBySenderIdAndReceiverId(senderId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

        if (like.getStatus() != Like.Status.PENDING) {
            throw new CustomException(ErrorCode.LIKE_ALREADY_PROCESSED);
        }

        like.reject();
        likeRepository.save(like);

        // 24시간 블록리스트 추가
        String blockKey = RANK_BLOCK_LIST_PREFIX + userId + ":" + senderId;
        redisTemplate.opsForValue().set(blockKey, "blocked", Duration.ofHours(24));

        // 거절자도 큐에서 제거 후 재진입 가능
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        exitRankQueue(userId, user.getGender());

        log.info("[랭크 매칭 거절] {} 거절 (상대: {}), 24시간 블록리스트 추가", userId, senderId);
    }

    /**
     * 배치: 60초 타임아웃된 좋아요 자동 거절
     */
    @Transactional
    public void autoRejectExpiredAcceptances() {
        List<Like> expiredLikes = likeRepository.findExpiredPendingLikes(Like.Status.PENDING);

        for (Like like : expiredLikes) {
            if (like.getExpiresAt().isBefore(LocalDateTime.now())) {
                like.autoReject();
                likeRepository.save(like);
            }
        }

        if (!expiredLikes.isEmpty()) {
            log.info("[자동 거절] {}건의 타임아웃된 랭크 매칭 자동 거절", expiredLikes.size());
        }
    }
}





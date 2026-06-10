package com.donga.dating.domain.chat.service;

import com.donga.dating.domain.evaluation.entity.Evaluation;
import com.donga.dating.domain.evaluation.repository.EvaluationRepository;
import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.repository.LikeRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * 채팅방 및 평가 서비스
 *
 * 주요 기능:
 * 1. 맞좋아요 시 채팅방 생성
 * 2. Redis TTL 기반 24시간 채팅방 만료
 * 3. 유령 매칭 감지 (대화 없이 24시간 경과)
 * 4. 평가 및 점수 갱신 (지수이동평균)
 * 5. 점수/티어 갱신 후 Redis 캐시 동기화
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatAndEvaluationService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final EvaluationRepository evaluationRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // Redis 키 프리픽스
    private static final String CHAT_ROOM_PREFIX = "chat:room:";
    private static final String CHAT_MESSAGE_COUNT_PREFIX = "chat:msg-count:";
    private static final String USER_CACHE_PREFIX = "user:cache:";

    /**
     * 맞좋아요 시 채팅방 생성 및 24시간 TTL 설정
     *
     * @param userId1 첫 번째 사용자 ID
     * @param userId2 두 번째 사용자 ID
     */
    @Transactional
    public Long createChatRoom(Long userId1, Long userId2) {
        // 1. 양방향 Like이 모두 ACCEPTED 상태인지 확인
        long mutualAccepts = likeRepository.countMutualAccepts(userId1, userId2, Like.Status.ACCEPTED);
        if (mutualAccepts != 2) {
            throw new CustomException(ErrorCode.LIKE_NOT_MUTUAL_ACCEPTED);
        }

        // 2. 채팅방 이미 생성되었는지 확인 (중복 방지)
        String roomKey = CHAT_ROOM_PREFIX + Math.min(userId1, userId2) + ":" + Math.max(userId1, userId2);
        Object existing = redisTemplate.opsForValue().get(roomKey);
        if (existing != null) {
            log.warn("[채팅방] 이미 생성된 채팅방 (사용자: {}, {})", userId1, userId2);
            return Long.parseLong(existing.toString());
        }

        // 3. DB에 ChatRoom 레코드 생성
        // (이 부분은 ChatRoom 엔티티 및 Repository 필요)
        // 임시로 Redis에만 저장하고 실제로는 DB 저장 필요
        Long roomId = generateChatRoomId(userId1, userId2);

        // 4. Redis에 TTL 설정 (24시간 = 86,400초)
        // - Expired Event Listener를 통해 만료 시 DB 상태 업데이트
        redisTemplate.opsForValue().set(
                roomKey,
                roomId.toString(),
                Duration.ofHours(24)
        );

        // 5. 메시지 카운트 초기화
        String msgCountKey = CHAT_MESSAGE_COUNT_PREFIX + roomId;
        redisTemplate.opsForValue().set(msgCountKey, "0", Duration.ofHours(24));

        log.info("[채팅방 생성] 방번호: {}, 사용자: {} ↔ {}, TTL: 24h", roomId, userId1, userId2);
        return roomId;
    }

    /**
     * 채팅방 ID 생성 (DB 저장 시)
     */
    private Long generateChatRoomId(Long userId1, Long userId2) {
        // 실제로는 DB에서 생성된 ID를 받아와야 함
        return Math.abs((userId1 + userId2) * 31 + System.nanoTime() % 1000000) ;
    }

    /**
     * 메시지 송수신 시 호출 (유령 매칭 감지용)
     *
     * @param roomId 채팅방 ID
     */
    @Transactional
    public void recordChatMessage(Long roomId) {
        // 메시지 카운트 증가
        String msgCountKey = CHAT_MESSAGE_COUNT_PREFIX + roomId;
        redisTemplate.opsForValue().increment(msgCountKey);

        // 유령 매칭 플래그 제거
        String ghostKey = "chat:ghost:" + roomId;
        redisTemplate.delete(ghostKey);

        log.debug("[채팅방] 메시지 기록 (방번호: {})", roomId);
    }

    /**
     * 배치: 24시간 만료된 채팅방 처리 및 유령 매칭 감지
     * - Redis Expired Event Listener에서 호출됨
     * - 또는 스케줄러에서 주기적으로 호출
     */
    @Transactional
    public void processExpiredChatRooms() {
        // Redis에서 자동으로 만료되므로, DB 상태 업데이트는 필요시에만

        // 유령 매칭 감지: 대화 없이 24시간이 지난 매칭
        Set<String> msgKeys = redisTemplate.keys(CHAT_MESSAGE_COUNT_PREFIX + "*");
        if (msgKeys != null) {
            for (String msgKey : msgKeys) {
                Object count = redisTemplate.opsForValue().get(msgKey);
                if (count != null && "0".equals(count.toString())) {
                    String roomId = msgKey.replace(CHAT_MESSAGE_COUNT_PREFIX, "");
                    log.warn("[유령 매칭 감지] 방번호: {}, 대화 없음", roomId);

                    // 해당 매칭을 "만남 미성사"로 자동 처리
                    handleGhostMatching(Long.parseLong(roomId));
                }
            }
        }

        log.info("[배치] 만료된 채팅방 처리 완료");
    }

    /**
     * 유령 매칭 처리 (대화 없이 24시간 경과)
     */
    @Transactional
    private void handleGhostMatching(Long roomId) {
        // DB에서 해당 채팅방의 Match 조회 및 상태 업데이트
        // → Match.status = "EXPIRED" 또는 "GHOST_MATCH"
        // → 평가 단계 건너뛰고 자동 종료

        log.info("[유령 매칭 자동 종료] 방번호: {}", roomId);
    }

    /**
     * 평가 제출
     *
     * @param userId 평가자 ID
     * @param targetUserId 피평가자 ID
     * @param score 점수 (1~5)
     */
    @Transactional
    public void submitEvaluation(Long userId, Long targetUserId, byte score) {
        // 1. 점수 검증
        if (score < 1 || score > 5) {
            throw new CustomException(ErrorCode.INVALID_SCORE);
        }

        // 2. 평가 중복 확인
        Optional<Evaluation> existing = evaluationRepository.findByEvaluatorAndTarget(userId, targetUserId);
        if (existing.isPresent()) {
            throw new CustomException(ErrorCode.EVALUATION_ALREADY_SUBMITTED);
        }

        // 3. 평가 저장
        // build Evaluation with User entities and score
        User evaluator = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        User evaluated = userRepository.findById(targetUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Evaluation evaluation = Evaluation.builder()
                .evaluator(evaluator)
                .evaluated(evaluated)
                .score(score)
                .build();

        evaluationRepository.save(evaluation);

        // 4. 피평가자의 점수 및 티어 갱신
        updateUserRankScore(targetUserId);

        log.info("[평가 제출] 평가자: {}, 피평가자: {}, 점수: {}", userId, targetUserId, score);
    }

    /**
     * 사용자의 rankScore 및 티어 갱신
     * - 공식: new_score = old_score * 0.8 + (avg_evaluation_score * 200) * 0.2
     * - 지수이동평균 적용
     */
    @Transactional
    private void updateUserRankScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 1. 평가 평균 계산
        double avgScore = evaluationRepository.getAverageScoreForUser(userId);
        long evaluateCount = evaluationRepository.countByEvaluatedId(userId);

        // 2. 새로운 rankScore 계산 (지수이동평균)
        BigDecimal oldScore = user.getRankScore();
        BigDecimal newScore = calculateNewRankScore(oldScore, avgScore);

        // 3. 티어 판정
        User.RankTier newTier = determineRankTier(newScore);

        // 4. 사용자 정보 업데이트
        user.setRankScore(newScore);
        user.setRankTier(newTier);
        user.setEvalCount((int) evaluateCount);

        userRepository.save(user);

        // 5. Redis 유저 캐시 동기화 (즉시 반영)
        evictUserCache(userId);

        log.info("[점수 갱신] 사용자: {}, 기존: {}, 신규: {}, 티어: {} → {}",
                userId, oldScore, newScore,
                user.getRankTier(), newTier);
    }

    /**
     * 새로운 rankScore 계산 (지수이동평균 공식)
     * new_score = old_score * 0.8 + (avg_evaluation_score * 200) * 0.2
     */
    private BigDecimal calculateNewRankScore(BigDecimal oldScore, double avgScore) {
        // old_score * 0.8
        BigDecimal weightedOld = oldScore.multiply(BigDecimal.valueOf(0.8));

        // (avg_evaluation_score * 200) * 0.2
        BigDecimal weightedNew = BigDecimal.valueOf(avgScore * 200 * 0.2);

        return weightedOld.add(weightedNew)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * rankScore 기반 티어 결정
     * - 0~999: BRONZE
     * - 1000~1999: SILVER
     * - 2000~2999: GOLD
     * - 3000~3999: PLATINUM
     * - 4000 이상: DIAMOND
     */
    private User.RankTier determineRankTier(BigDecimal rankScore) {
        int score = rankScore.intValue();

        if (score >= 4000) {
            return User.RankTier.DIAMOND;
        } else if (score >= 3000) {
            return User.RankTier.PLATINUM;
        } else if (score >= 2000) {
            return User.RankTier.GOLD;
        } else if (score >= 1000) {
            return User.RankTier.SILVER;
        } else {
            return User.RankTier.BRONZE;
        }
    }

    /**
     * 사용자 캐시 동기화 (Redis에서 제거)
     * - 다음 조회 시 DB에서 새로 로드됨
     */
    @Transactional
    public void evictUserCache(Long userId) {
        String cacheKey = USER_CACHE_PREFIX + userId;
        redisTemplate.delete(cacheKey);

        // 랭크 큐에 있는 사용자 정보도 갱신 필요
        // (별도의 캐시 무효화 로직)

        log.debug("[캐시 동기화] 사용자 {} 캐시 제거", userId);
    }

    /**
     * 평가 제출 기간 확인
     * - 채팅방 만료 후 12시간 이내만 평가 가능
     */
    public boolean canSubmitEvaluation(Long roomId) {
        // Redis에서 채팅방 만료 시각 조회
        Long expiresAt = redisTemplate.getExpire(CHAT_ROOM_PREFIX + roomId);

        // expiresAt이 null이면 이미 만료됨
        // 12시간 = 43,200초인데, 남은 시간이 12시간을 넘으면 아직 조기
        // 남은 시간이 0 이상 12시간 이하면 평가 가능

        if (expiresAt == null || expiresAt < 0) {
            // 만료됨 - 12시간 내 평가 가능 여부 별도 처리 필요
            return true; // 임시
        }

        // 12시간 = 43,200초
        return (24 * 3600 - expiresAt) <= (12 * 3600); // 24H - 남은시간이 12H 이하면 true
    }
}





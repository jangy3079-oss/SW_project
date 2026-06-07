package com.donga.dating.domain.matching.service;

import com.donga.dating.domain.matching.entity.*;
import com.donga.dating.domain.matching.repository.MatchExposureHistoryRepository;
import com.donga.dating.domain.matching.repository.RerollCounterRepository;
import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.repository.LikeRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;

/**
 * 공강 매칭 서비스
 *
 * 1. 매일 자정 배치로 실행
 * 2. 공강 시간이 중복되는 이성 간 매칭
 * 3. 남만/여만 차등 정책 적용 (남: 2명, 여: 전체)
 * 4. 리롤 기회 사용 가능하게 함
 * 5. 노출 이력 관리 (7일 중복 노출 방지)
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GonggangMatchingService {

    private final LikeRepository likeRepository;
    private final RerollCounterRepository rerollCounterRepository;
    private final MatchExposureHistoryRepository exposureHistoryRepository;
    private final UserRepository userRepository;

    /**
     * 공강 매칭 배치 실행
     * - 자정에 호출됨
     * - 매칭 대기 사용자들을 조회하여 공강 시간 기반 매칭
     */
    @Transactional
    public void executeGonggangMatchingBatch() {
        log.info("[공강 매칭 배치] 시작");

        try {
            // 1. 리롤 카운터 오늘 초기화
            initializeRerollCountersForToday();

            // 2. 만료된 노출 이력 정리
            cleanupExpiredExposures();

            // 3. 실제 매칭 로직 (chunk 기반 배치로 DB 부하 분산)
            // (배치 설정에서 Job으로 처리됨 - 별도의 BatchConfig에서 구현)

            log.info("[공강 매칭 배치] 완료");
        } catch (Exception e) {
            log.error("[공강 매칭 배치] 실패", e);
            throw new CustomException(ErrorCode.BATCH_EXECUTION_FAILED);
        }
    }

    /**
     * 리롤 카운터 오늘 초기화
     * - 모든 남성 리롤 카운터를 3회로 리셋
     */
    @Transactional
    public void initializeRerollCountersForToday() {
        log.info("[리롤 초기화] 배치 시작");
        rerollCounterRepository.resetAllForToday();
        log.info("[리롤 초기화] 완료");
    }

    /**
     * 만료된 노출 이력 정리
     */
    @Transactional
    public void cleanupExpiredExposures() {
        List<MatchExposureHistory> expiredExposures = exposureHistoryRepository.findExpiredExposures();
        if (!expiredExposures.isEmpty()) {
            expiredExposures.forEach(exposureHistoryRepository::delete);
            log.info("[노출 이력 정리] {}건 삭제", expiredExposures.size());
        }
    }

    /**
     * 특정 사용자에게 공강 후보 제시
     * (배치에서 호출됨)
     *
     * @param userId 남성 또는 여성 사용자 ID
     * @param isMale 남성 여부
     */
    @Transactional
    public void generateCandidatesForUser(Long userId, boolean isMale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 공강 시간 정보 조회 필요 (schedule 테이블 사용)
        // 여기서는 예시만 제시

        if (isMale) {
            // 남성: 2명만 노출 + 리롤 기회
            generateCandidatesForMale(user);
        } else {
            // 여성: 전체 노출 + 무제한 리롤
            generateCandidatesForFemale(user);
        }
    }

    /**
     * 남성 사용자 후보 생성 (최대 2명)
     */
    private void generateCandidatesForMale(User maleUser) {
        Long maleUserId = maleUser.getUserId();

        // 이성(여성) 후보 조회
        List<User> femaleUsers = userRepository.findAllByGender(User.Gender.FEMALE);

        // 1. 이미 좋아요를 보낸 대상 제외
        List<Like> existingLikes = likeRepository.findPendingLikesBySender(maleUserId, Like.Status.PENDING);
        Set<Long> existingTargets = existingLikes.stream()
                .map(Like::getReceiverId)
                .collect(Collectors.toSet());

        // 2. 노출 이력이 있는 대상 제외 (7일 이내)
        Set<Long> exposedTargets = new HashSet<>();
        for (User female : femaleUsers) {
            if (exposureHistoryRepository.existsValidExposure(
                    maleUserId, female.getUserId(), MatchType.GENERAL.name())) {
                exposedTargets.add(female.getUserId());
            }
        }

        // 3. 필터링된 후보 중 최대 2명 선택
        List<User> validCandidates = femaleUsers.stream()
                .filter(f -> !existingTargets.contains(f.getUserId()))
                .filter(f -> !exposedTargets.contains(f.getUserId()))
                .limit(2)
                .toList();

        // 4. 좋아요 발송 (Like 생성)
        for (User candidate : validCandidates) {
            createLike(maleUserId, candidate.getUserId(), MatchType.GENERAL);
        }

        log.info("[공강 매칭] 남성 사용자 {}에게 {}명 후보 제시",
                maleUserId, validCandidates.size());
    }

    /**
     * 여성 사용자 후보 생성 (전체 노출)
     */
    private void generateCandidatesForFemale(User femaleUser) {
        Long femaleUserId = femaleUser.getUserId();

        // 이성(남성) 후보 조회
        List<User> maleUsers = userRepository.findAllByGender(User.Gender.MALE);

        // 1. 이미 좋아요를 받은 대상 제외
        List<Like> incomingLikes = likeRepository.findPendingLikesByReceiver(femaleUserId, Like.Status.PENDING);
        Set<Long> existingReceivers = incomingLikes.stream()
                .map(Like::getSenderId)
                .collect(Collectors.toSet());

        // 2. 필터링되지 않음 (여성은 모든 후보 볼 수 있음)

        // 3. 좋아요 받기 준비 (UI 상에서 표시)
        log.info("[공강 매칭] 여성 사용자 {}에게 {}명 후보 제시",
                femaleUserId, maleUsers.size() - existingReceivers.size());
    }

    /**
     * 좋아요 발송
     * - 발신자가 유효하고, 중복이 아닌지 확인
     */
    @Transactional
    public void createLike(Long senderId, Long receiverId, MatchType matchType) {
        // 1. 이미 좋아요가 있는지 확인
        Optional<Like> existing = likeRepository.findBySenderIdAndReceiverId(senderId, receiverId);
        if (existing.isPresent()) {
            log.warn("[좋아요 중복] 사용자 {} → {}에게 이미 좋아요 존재", senderId, receiverId);
            return;
        }

        // 2. Like 생성
        // load User entities
        com.donga.dating.domain.user.entity.User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        com.donga.dating.domain.user.entity.User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Like like = Like.builder()
                .sender(sender)
                .receiver(receiver)
                .status(Like.Status.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        likeRepository.save(like);
        log.info("[좋아요 발송] {} → {}", senderId, receiverId);
    }

    /**
     * 좋아요 리롤 처리 (남성 전용, 제한된 횟수)
     * - 현재 좋아요를 패스하고 다음 후보 표시
     */
    @Transactional
    public void rerollLike(Long maleUserId, Long femaleUserId) {
        // 1. 리롤 횟수 확인
        RerollCounter counter = rerollCounterRepository.findByUserId(maleUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.REROLL_COUNTER_NOT_FOUND));

        if (!counter.canReroll()) {
            throw new CustomException(ErrorCode.REROLL_LIMIT_EXCEEDED);
        }

        // 2. 리롤 횟수 차감
        counter.useReroll();
        rerollCounterRepository.save(counter);

        // 3. 노출 이력 기록 (7일 동안 재노출 방지)
        MatchExposureHistory exposure = MatchExposureHistory.builder()
                .sourceUserId(maleUserId)
                .targetUserId(femaleUserId)
                .matchType(MatchType.GENERAL)
                .exposureReason(ExposureReason.REROLL_PASS)
                .exposedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        exposureHistoryRepository.save(exposure);
        log.info("[리롤] 사용자 {}가 후보 {}를 패스 (남은 기회: {})",
                maleUserId, femaleUserId, counter.getRemainingRerolls());
    }

    /**
     * 좋아요 거절 처리
     * - 노출 이력 기록 (7일)
     */
    @Transactional
    public void rejectLike(Long likeId) {
        Like like = likeRepository.findById(likeId)
                .orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

        if (like.getStatus() != Like.Status.PENDING) {
            throw new CustomException(ErrorCode.LIKE_ALREADY_PROCESSED);
        }

        // 상태 전이
        like.reject();
        likeRepository.save(like);

        // 노출 이력 기록
        MatchExposureHistory exposure = MatchExposureHistory.builder()
                .sourceUserId(like.getSenderId())
                .targetUserId(like.getReceiverId())
                .matchType(MatchType.GENERAL)
                .exposureReason(ExposureReason.REJECTED)
                .exposedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        exposureHistoryRepository.save(exposure);
        log.info("[거절] 사용자 {}가 {}의 좋아요 거절", like.getReceiverId(), like.getSenderId());
    }






}

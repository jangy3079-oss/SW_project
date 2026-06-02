package com.donga.dating.domain.like.service;

import com.donga.dating.domain.like.dto.LikeResponse;
import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.repository.LikeRepository;
import com.donga.dating.domain.matching.dto.MatchResponse;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.entity.MatchQueue;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.matching.repository.MatchQueueRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LikeService {
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final MatchQueueRepository queueRepository;

    /** 하트 보내기 */
    @Transactional
    public LikeResponse sendHeart(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (likeRepository.findBySender_UserIdAndReceiver_UserId(senderId, receiverId).isPresent()) {
            throw new CustomException(ErrorCode.ALREADY_SENT_HEART);
        }

        Like like = Like.builder()
                .sender(sender)
                .receiver(receiver)
                .status(Like.Status.PENDING)
                .build();

        likeRepository.save(like);
        return LikeResponse.from(like);
    }

    /** 하트 수락 → 공강 검증 → 매칭 생성 + 다른 하트 자동 거절 */
    @Transactional
    public MatchResponse acceptHeart(Long likeId) {
        Like like = likeRepository.findById(likeId)
                .orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

        if (like.getStatus() != Like.Status.PENDING) {
            throw new CustomException(ErrorCode.LIKE_ALREADY_PROCESSED);
        }

        User sender = like.getSender();
        User receiver = like.getReceiver();

        // 프로필 공개 여부 체크
        if (sender.getIsActive() == null || !sender.getIsActive()
                || receiver.getIsActive() == null || !receiver.getIsActive()) {
            throw new CustomException(ErrorCode.PROFILE_NOT_ACTIVE);
        }

        // 큐 존재 여부 확인 (둘 다 LECTURE 대기 중이어야 함)
        MatchQueue senderQueue = queueRepository
                .findByUser_UserIdAndMatchTypeAndStatus(sender.getUserId(), Match.MatchType.LECTURE, MatchQueue.QueueStatus.WAITING)
                .orElseThrow(() -> new CustomException(ErrorCode.QUEUE_NOT_FOUND));
        MatchQueue receiverQueue = queueRepository
                .findByUser_UserIdAndMatchTypeAndStatus(receiver.getUserId(), Match.MatchType.LECTURE, MatchQueue.QueueStatus.WAITING)
                .orElseThrow(() -> new CustomException(ErrorCode.QUEUE_NOT_FOUND));

        // 공강 시간 겹침 검사 (같은 요일이고 시간 범위 겹침)
        if (senderQueue.getLectureDay() == null || receiverQueue.getLectureDay() == null
                || !senderQueue.getLectureDay().equals(receiverQueue.getLectureDay())
                || senderQueue.getLectureStartTime().isAfter(receiverQueue.getLectureEndTime())
                || receiverQueue.getLectureStartTime().isAfter(senderQueue.getLectureEndTime())) {
            throw new CustomException(ErrorCode.INVALID_MATCH_CONDITION);
        }

        // 수락 처리
        like.accept();

        User male = sender.getGender() == User.Gender.MALE ? sender : receiver;
        User female = sender.getGender() == User.Gender.FEMALE ? sender : receiver;

        Match match = Match.builder()
                .maleUser(male)
                .femaleUser(female)
                .matchType(Match.MatchType.LECTURE)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();

        matchRepository.save(match);

        // 보낸 사람의 다른 PENDING 하트 자동 거절 (현재 수락한 likeId 제외)
        List<Like> otherSent = likeRepository.findBySender_UserIdAndStatus(sender.getUserId(), Like.Status.PENDING);
        otherSent.stream()
                .filter(l -> !l.getLikeId().equals(likeId))
                .forEach(Like::reject);

        // 큐 상태 업데이트: 양쪽 큐 matched 처리
        senderQueue.matched();
        receiverQueue.matched();

        return MatchResponse.from(match, male.getUserId());
    }

    /** 하트 거절 */
    @Transactional
    public LikeResponse rejectHeart(Long likeId) {
        Like like = likeRepository.findById(likeId)
                .orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

        if (like.getStatus() != Like.Status.PENDING) {
            throw new CustomException(ErrorCode.LIKE_ALREADY_PROCESSED);
        }

        like.reject();
        return LikeResponse.from(like);
    }

    /** 내가 받은 하트 조회 */
    @Transactional(readOnly = true)
    public List<LikeResponse> getReceivedHearts(Long userId) {
        return likeRepository.findByReceiver_UserIdAndStatus(userId, Like.Status.PENDING)
                .stream()
                .map(LikeResponse::from)
                .toList();
    }

    /** 내가 보낸 하트 조회 */
    @Transactional(readOnly = true)
    public List<LikeResponse> getSentHearts(Long userId) {
        return likeRepository.findBySender_UserIdAndStatus(userId, Like.Status.PENDING)
                .stream()
                .map(LikeResponse::from)
                .toList();
    }
}
package com.donga.dating.domain.like.service;

import com.donga.dating.domain.like.dto.LikeResponse;
import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.repository.LikeRepository;
import com.donga.dating.domain.matching.dto.MatchResponse;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LikeService {
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;

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

    /** 하트 수락 → 매칭 생성 */
    @Transactional
    public MatchResponse acceptHeart(Long likeId) {
        Like like = likeRepository.findById(likeId)
                .orElseThrow(() -> new CustomException(ErrorCode.LIKE_NOT_FOUND));

        if (like.getStatus() != Like.Status.PENDING) {
            throw new CustomException(ErrorCode.LIKE_ALREADY_PROCESSED);
        }

        like.accept();

        User male = like.getSender().getGender() == User.Gender.MALE ? like.getSender() : like.getReceiver();
        User female = like.getSender().getGender() == User.Gender.FEMALE ? like.getSender() : like.getReceiver();

        Match match = Match.builder()
                .maleUser(male)
                .femaleUser(female)
                .matchType(Match.MatchType.GENERAL) // 필요 시 큐 타입 반영
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();

        matchRepository.save(match);

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
}

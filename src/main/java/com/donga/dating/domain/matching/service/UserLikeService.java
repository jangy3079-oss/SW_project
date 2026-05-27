package com.donga.dating.domain.matching.service;

import com.donga.dating.domain.matching.entity.UserLike;
import com.donga.dating.domain.matching.repository.UserLikeRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserLikeService {

    private final UserLikeRepository userLikeRepository;
    private final UserRepository userRepository;

    @Transactional
    public void like(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw new CustomException(ErrorCode.LIKING_SELF);
        }

        User from = userRepository.findById(fromUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        User to = userRepository.findById(toUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (userLikeRepository.existsByFromUserUserIdAndToUserUserId(fromUserId, toUserId)) {
            throw new CustomException(ErrorCode.ALREADY_LIKED);
        }

        UserLike like = UserLike.builder()
                .fromUser(from)
                .toUser(to)
                .build();

        userLikeRepository.save(like);
    }
}

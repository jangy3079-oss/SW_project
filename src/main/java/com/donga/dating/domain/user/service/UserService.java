package com.donga.dating.domain.user.service;

import com.donga.dating.domain.user.dto.ProfileDtos.BioUpdateRequest;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileResponse;
import com.donga.dating.domain.user.dto.ProfileDtos.ProfileUpsertRequest;
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
public class UserService {

    private final UserRepository userRepository;

    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(getUser(userId));
    }

    @Transactional
    public ProfileResponse upsertProfile(Long userId, ProfileUpsertRequest request) {
        User user = getUser(userId);

        userRepository.findByStudentId(request.studentId())
                .ifPresent(existing -> {
                    if (!existing.getUserId().equals(userId)) {
                        throw new CustomException(ErrorCode.STUDENT_ID_ALREADY_EXISTS);
                    }
                });

        user.updateProfile(
                request.name(),
                request.gender(),
                request.birthDate(),
                request.studentId(),
                request.department(),
                request.grade(),
                request.bio()
        );

        return ProfileResponse.from(user);
    }

    @Transactional
    public ProfileResponse updateBio(Long userId, BioUpdateRequest request) {
        User user = getUser(userId);
        user.updateBio(request.bio());
        return ProfileResponse.from(user);
    }

    // TODO: 나머지 비즈니스 로직 구현
}

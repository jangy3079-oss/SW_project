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
import com.donga.dating.domain.user.dto.PreferenceDtos.PreferencesUpdateRequest;
import com.donga.dating.domain.user.dto.PreferenceDtos.PreferencesResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

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

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public PreferencesResponse getPreferences(Long userId) {
        User user = getUser(userId);
        String json = user.getPreferences();
        if (json == null) return PreferencesResponse.from(java.util.Collections.emptyMap());
        try {
            java.util.Map<String, String> map = OBJECT_MAPPER.readValue(json, new TypeReference<java.util.Map<String, String>>() {});
            return PreferencesResponse.from(map);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public PreferencesResponse updatePreferences(Long userId, PreferencesUpdateRequest request) {
        User user = getUser(userId);
        try {
            String json = OBJECT_MAPPER.writeValueAsString(request.preferences());
            user.updatePreferences(json);
            return PreferencesResponse.from(request.preferences());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}

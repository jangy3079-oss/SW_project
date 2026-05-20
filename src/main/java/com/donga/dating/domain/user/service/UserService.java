package com.donga.dating.domain.user.service;

import com.donga.dating.domain.photo.dto.UserPhotoResponse;
import com.donga.dating.domain.photo.service.PhotoService;
import com.donga.dating.domain.user.dto.ProfileDtos.*;
import com.donga.dating.domain.user.dto.PreferenceDtos.PreferencesResponse;
import com.donga.dating.domain.user.dto.PreferenceDtos.PreferencesUpdateRequest;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PhotoService photoService;

    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(getUser(userId));
    }

    /**
     * 프로필 + 사진 통합 조회 (프론트 연동용)
     */
    public ProfileWithPhotosResponse getProfileWithPhotos(Long userId) {
        User user = getUser(userId);
        List<UserPhotoResponse> photos = photoService.getPhotos(userId).stream()
                .map(UserPhotoResponse::from)
                .toList();
        return ProfileWithPhotosResponse.from(user, photos);
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

        // bio 검증 (선택사항)
        if (request.bio() != null && !request.bio().isBlank()) {
            validateBio(request.bio());
        }

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
        String bio = request.bio();
        validateBio(bio);
        user.updateBio(bio);
        return ProfileResponse.from(user);
    }

    // TODO: 나머지 비즈니스 로직 구현

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public PreferencesResponse getPreferences(Long userId) {
        User user = getUser(userId);
        String json = user.getPreferences();
        if (json == null) return PreferencesResponse.from(java.util.Collections.emptyMap());
        try {
            java.util.Map<String, Object> map = OBJECT_MAPPER.readValue(json, new TypeReference<java.util.Map<String, Object>>() {});
            return PreferencesResponse.from(map);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public PreferencesResponse updatePreferences(Long userId, PreferencesUpdateRequest request) {
        User user = getUser(userId);
        try {
            // validate against template
            validatePreferences(request.preferences());
            String json = OBJECT_MAPPER.writeValueAsString(request.preferences());
            user.updatePreferences(json);
            return PreferencesResponse.from(request.preferences());
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private void validatePreferences(java.util.Map<String, Object> prefs) {
        if (prefs == null || prefs.isEmpty()) return;
        try {
            org.springframework.core.io.ClassPathResource res = new org.springframework.core.io.ClassPathResource("static/preferences.json");
            java.util.Map template = OBJECT_MAPPER.readValue(res.getInputStream(), java.util.Map.class);
            java.util.List categories = (java.util.List) template.get("categories");

            java.util.Map<String, String> typeById = new java.util.HashMap<>();
            java.util.Map<String, java.util.Set<String>> allowedById = new java.util.HashMap<>();

            for (Object cObj : categories) {
                java.util.Map c = (java.util.Map) cObj;
                String id = (String) c.get("id");
                String type = (String) c.get("type");
                typeById.put(id, type);
                java.util.List options = (java.util.List) c.get("options");
                java.util.Set<String> allowed = new java.util.HashSet<>();
                for (Object oObj : options) {
                    java.util.Map o = (java.util.Map) oObj;
                    allowed.add(String.valueOf(o.get("value")));
                }
                allowedById.put(id, allowed);
            }

            for (java.util.Map.Entry<String, Object> e : prefs.entrySet()) {
                String key = e.getKey();
                if (!typeById.containsKey(key)) {
                    throw new CustomException(ErrorCode.PREF_INVALID_KEY);
                }
                String type = typeById.get(key);
                Object val = e.getValue();
                if ("single".equals(type)) {
                    if (!(val instanceof String)) throw new CustomException(ErrorCode.PREF_INVALID_VALUE);
                    if (!allowedById.get(key).contains(val)) throw new CustomException(ErrorCode.PREF_INVALID_VALUE);
                } else if ("multi".equals(type)) {
                    if (val instanceof java.util.List) {
                        for (Object item : (java.util.List) val) {
                            if (!allowedById.get(key).contains(String.valueOf(item))) {
                                throw new CustomException(ErrorCode.PREF_INVALID_VALUE);
                            }
                        }
                    } else {
                        throw new CustomException(ErrorCode.PREF_INVALID_VALUE);
                    }
                } else {
                    throw new CustomException(ErrorCode.PREF_INVALID_VALUE);
                }
            }

        } catch (CustomException ce) {
            throw ce;
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    // ── 검증 메서드 ──────────────────────────

    private void validateBio(String bio) {
        if (bio == null || bio.isBlank()) {
            throw new CustomException(ErrorCode.BIO_EMPTY);
        }
        if (bio.length() > 500) {
            throw new CustomException(ErrorCode.BIO_TOO_LONG);
        }
    }
}

package com.donga.dating.domain.user.dto;

import com.donga.dating.domain.photo.dto.UserPhotoResponse;
import com.donga.dating.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ProfileDtos {

    private ProfileDtos() {
    }

    public record ProfileUpsertRequest(
            String name,
            User.Gender gender,
            LocalDate birthDate,
            String studentId,
            String department,
            Byte grade,
            String bio
    ) {
    }

    public record BioUpdateRequest(String bio) {
    }

    @Getter
    @Builder
    public static class ProfileResponse {
        private Long userId;
        private String email;
        private String name;
        private String gender;
        private LocalDate birthDate;
        private String studentId;
        private String department;
        private Byte grade;
        private String bio;
        private BigDecimal rankScore;
        private String rankTier;
        private int evalCount;
        private boolean emailVerified;
        private Boolean isActive;

        public static ProfileResponse from(User user) {
            return ProfileResponse.builder()
                    .userId(user.getUserId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .gender(user.getGender().name())
                    .birthDate(user.getBirthDate())
                    .studentId(user.getStudentId())
                    .department(user.getDepartment())
                    .grade(user.getGrade())
                    .bio(user.getBio())
                    .rankScore(user.getRankScore())
                    .rankTier(user.getRankTier().name())
                    .evalCount(user.getEvalCount())
                    .emailVerified(user.isEmailVerified())
                    .isActive(user.getIsActive())
                    .build();
        }
    }

    /**
     * 프론트 연동용: 프로필 + 사진 통합 응답
     * GET /api/users/{userId}/profile-with-photos 에서 사용
     */
    @Getter
    @Builder
    public static class ProfileWithPhotosResponse {
        private ProfileResponse profile;
        private List<UserPhotoResponse> photos;

        public static ProfileWithPhotosResponse from(User user, List<UserPhotoResponse> photos) {
            return ProfileWithPhotosResponse.builder()
                    .profile(ProfileResponse.from(user))
                    .photos(photos)
                    .build();
        }
    }
}

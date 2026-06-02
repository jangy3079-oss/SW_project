package com.donga.dating.domain.user.dto;

import com.donga.dating.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class UserProfileDto {
    private Long userId;
    private String name;
    private String email;
    private User.Gender gender;
    private String department;
    private Byte grade;
    private String bio;
    private User.RankTier rankTier;
    private BigDecimal rankScore;
    private Boolean isActive;

    public static UserProfileDto from(User user) {
        return UserProfileDto.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .gender(user.getGender())
                .department(user.getDepartment())
                .grade(user.getGrade())
                .bio(user.getBio())
                .rankTier(user.getRankTier())
                .rankScore(user.getRankScore())
                .isActive(user.getIsActive())
                .build();
    }
}
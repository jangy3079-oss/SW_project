package com.donga.dating.domain.matching.dto;

import com.donga.dating.domain.like.entity.Like;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 좋아요 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LikeResponseDto {
    private Long likeId;
    private Long senderId;
    private Long receiverId;
    private Like.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean isValid;
}



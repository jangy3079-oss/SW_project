package com.donga.dating.domain.like.dto;

import com.donga.dating.domain.like.entity.Like;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class LikeResponse {
    private Long likeId;
    private Long senderId;
    private Long receiverId;
    private String status;
    private LocalDateTime createdAt;

    public static LikeResponse from(Like like) {
        return LikeResponse.builder()
                .likeId(like.getLikeId())
                .senderId(like.getSender().getUserId())
                .receiverId(like.getReceiver().getUserId())
                .status(like.getStatus().name())
                .createdAt(like.getCreatedAt())
                .build();
    }
}

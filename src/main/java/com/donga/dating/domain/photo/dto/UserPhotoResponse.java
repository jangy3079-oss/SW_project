package com.donga.dating.domain.photo.dto;

import com.donga.dating.domain.photo.entity.UserPhoto;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserPhotoResponse {

    private Long photoId;
    private Long userId;
    private String fileName;
    private String viewUrl;
    private String originalName;
    private Long fileSize;
    private Boolean isPrimary;
    private byte photoOrder;
    private LocalDateTime createdAt;

    public static UserPhotoResponse from(UserPhoto photo) {
        return UserPhotoResponse.builder()
                .photoId(photo.getPhotoId())
                .userId(photo.getUser().getUserId())
                .fileName(photo.getFileName())
                .viewUrl("/api/users/" + photo.getUser().getUserId() + "/photos/" + photo.getPhotoId() + "/view")
                .originalName(photo.getOriginalName())
                .fileSize(photo.getFileSize())
                .isPrimary(photo.getIsPrimary())
                .photoOrder(photo.getPhotoOrder())
                .createdAt(photo.getCreatedAt())
                .build();
    }
}

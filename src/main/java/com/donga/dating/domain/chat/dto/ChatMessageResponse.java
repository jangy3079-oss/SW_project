package com.donga.dating.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 채팅 메시지 응답
 */
@Getter
@Builder
public class ChatMessageResponse {

    /**
     * 메시지 고유 번호
     */
    private Long messageId;

    /**
     * 보낸 사용자 고유 번호
     */
    private Long senderId;

    /**
     * 메시지 내용
     */
    private String content;

    /**
     * 읽음 여부
     */
    private Boolean isRead;

    /**
     * 보낸 시간
     */
    private LocalDateTime createdAt;
}
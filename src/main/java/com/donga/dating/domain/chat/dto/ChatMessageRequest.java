package com.donga.dating.domain.chat.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 채팅 메시지 전송 요청
 */
@Getter
@Setter
public class ChatMessageRequest {

    /**
     * 보낼 메시지 내용
     */
    private String content;
}
package com.donga.dating.domain.chat.dto;

import com.donga.dating.domain.chat.entity.ChatRoomStatus;
import lombok.Builder;
import lombok.Getter;

/**
 * 채팅방 목록 응답
 */
@Getter
@Builder
public class ChatRoomResponse {

    /**
     * 채팅방 고유 번호
     */
    private Long roomId;

    /**
     * 매칭 고유 번호
     */
    private Long matchId;

    /**
     * 상대방 이름
     */
    private String opponentName;

    /**
     * 최근 메시지
     */
    private String latestMessage;

    /**
     * 안 읽은 메시지 개수
     */
    private Long unreadCount;

    /**
     * 채팅방 상태
     */
    private ChatRoomStatus status;
}
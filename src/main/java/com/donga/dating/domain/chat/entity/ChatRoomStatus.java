package com.donga.dating.domain.chat.entity;

/**
 * 채팅방 상태
 * ACTIVE  : 채팅 가능
 * CLOSED  : 매칭 종료 등으로 채팅 종료
 * BLOCKED : 차단으로 인해 채팅 제한
 */
public enum ChatRoomStatus {
    ACTIVE,
    CLOSED,
    BLOCKED
}
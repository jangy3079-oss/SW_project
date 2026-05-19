package com.donga.dating.domain.chat.repository;

import com.donga.dating.domain.chat.entity.ChatMessage;
import com.donga.dating.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 채팅 메시지 데이터 조회 Repository
 */
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 특정 채팅방의 메시지를 보낸 시간 순서대로 조회
     */
    List<ChatMessage> findByRoomAndIsDeletedFalseOrderByCreatedAtAsc(ChatRoom room);

    /**
     * 읽지 않은 상대방 메시지 조회
     */
    List<ChatMessage> findByRoomAndSender_UserIdNotAndIsReadFalse(
            ChatRoom room,
            Long userId
    );

    /**
     * 특정 채팅방에서 현재 사용자가 아직 읽지 않은 상대방 메시지 개수 조회
     */
    long countByRoomAndSender_UserIdNotAndIsReadFalse(
            ChatRoom room,
            Long userId
    );

    /**
     * 특정 채팅방의 가장 최근 메시지 1개 조회
     */
    Optional<ChatMessage> findTopByRoomAndIsDeletedFalseOrderByCreatedAtDesc(ChatRoom room);
}
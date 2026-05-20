package com.donga.dating.domain.chat.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 채팅 메시지 엔티티
 *
 * - 채팅방(room) 기준으로 메시지 저장
 * - 읽음 여부 관리
 * - 삭제 여부 관리
 */
@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    /**
     * 메시지 PK
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    /**
     * 연결된 채팅방
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    /**
     * 메시지 보낸 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /**
     * 메시지 내용
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 읽음 여부
     */
    @Column(nullable = false)
    private Boolean isRead;

    /**
     * 삭제 여부
     */
    @Column(nullable = false)
    private Boolean isDeleted;

    /**
     * 메시지 전송 시간
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;
}
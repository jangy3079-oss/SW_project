package com.donga.dating.domain.chat.entity;

import com.donga.dating.domain.matching.entity.Match;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 1:1 채팅방 엔티티
 * - 매칭(match) 기준으로 채팅방 생성
 * - 매칭된 사용자만 채팅 가능
 * - 채팅방 상태 관리
 */
@Entity
@Table(name = "chat_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRoom {

    /**
     * 채팅방 Primary Key
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomId;

    /**
     * 연결된 매칭 정보
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    /**
     * 채팅방 상태
     * ACTIVE  : 채팅 가능
     * CLOSED  : 종료됨
     * BLOCKED : 차단 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRoomStatus status;

    /**
     * 채팅방 생성 시간
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * 채팅방 상태 변경
     */
    public void changeStatus(ChatRoomStatus status) {
        this.status = status;
    }
}
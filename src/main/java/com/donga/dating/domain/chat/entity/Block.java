package com.donga.dating.domain.chat.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 차단 엔티티
 *
 * - 특정 사용자가 다른 사용자를 차단한 기록 저장
 * - 차단 시 채팅 및 상호작용 제한에 사용
 */
@Entity
@Table(name = "blocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Block {

    /**
     * 차단 기록 고유 번호
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long blockId;

    /**
     * 차단한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    /**
     * 차단당한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    /**
     * 차단한 시간
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;
}
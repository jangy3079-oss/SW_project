package com.donga.dating.domain.chat.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 신고 엔티티
 *
 * - 특정 사용자가 다른 사용자를 신고한 기록 저장
 * - 욕설, 스팸, 부적절한 행동 등 신고 사유 저장
 */
@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    /**
     * 신고 기록 고유 번호
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;

    /**
     * 신고한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /**
     * 신고당한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_id", nullable = false)
    private User reported;

    /**
     * 신고 사유
     */
    @Column(nullable = false)
    private String reason;

    /**
     * 신고한 시간
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;
}
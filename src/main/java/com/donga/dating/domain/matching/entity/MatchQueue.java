package com.donga.dating.domain.matching.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "match_queue")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class MatchQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long queueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Match.MatchType matchType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QueueStatus status = QueueStatus.WAITING;

    @CreationTimestamp
    private LocalDateTime enteredAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── 비즈니스 메서드 ──────────────────────────

    public void matched() {
        this.status = QueueStatus.MATCHED;
    }

    public void cancel() {
        this.status = QueueStatus.CANCELLED;
    }

    // ── Enum ─────────────────────────────────────

    public enum QueueStatus {
        WAITING, MATCHED, CANCELLED
    }
}

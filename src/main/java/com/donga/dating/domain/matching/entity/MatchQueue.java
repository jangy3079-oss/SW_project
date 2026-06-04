package com.donga.dating.domain.matching.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private DayOfWeek lectureDay;   // 공강 요일

    @Column(nullable = true)
    private LocalTime lectureStartTime;   // 공강 시작 시간

    @Column(nullable = true)
    private LocalTime lectureEndTime;     // 공강 종료 시간

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

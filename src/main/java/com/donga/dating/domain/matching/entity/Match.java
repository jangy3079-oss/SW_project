package com.donga.dating.domain.matching.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long matchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "male_user_id", nullable = false)
    private User maleUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "female_user_id", nullable = false)
    private User femaleUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchType matchType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MatchStatus status = MatchStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime matchedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── 비즈니스 메서드 ──────────────────────────

    public void expire() {
        this.status = MatchStatus.EXPIRED;
    }          // 시간 초과로 자동 종료

    public void evaluate() {
        this.status = MatchStatus.EVALUATED;
    }      // 유저가 평가를 완료한 종료

    public void cancel() { this.status = MatchStatus.CANCELLED; }        // 유저의 리롤로 중도 취소

    // ── Enum ─────────────────────────────────────

    public enum MatchType {
        GENERAL, RANK, LECTURE
    }

    public enum MatchStatus {
        ACTIVE, EVALUATED, EXPIRED, CANCELLED
    }
}

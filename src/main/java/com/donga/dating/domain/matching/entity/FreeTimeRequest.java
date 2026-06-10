package com.donga.dating.domain.matching.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "free_time_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class FreeTimeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "male_user_id", nullable = false)
    private User maleUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "female_user_id", nullable = false)
    private User femaleUser;

    @Column(nullable = false)
    private LocalDate matchedDate;

    @Column(nullable = false)
    private LocalTime overlapStart;

    @Column(nullable = false)
    private LocalTime overlapEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    /** 수락 시 생성된 매칭 ID (수락 전 null) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = true)
    private Match match;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── 비즈니스 메서드 ──────────────────────────

    public void accept(Match createdMatch) {
        this.status = RequestStatus.ACCEPTED;
        this.match  = createdMatch;
    }

    public void reject() {
        this.status = RequestStatus.REJECTED;
    }

    public void expire() {
        this.status = RequestStatus.EXPIRED;
    }

    // ── Enum ─────────────────────────────────────

    public enum RequestStatus {
        PENDING, ACCEPTED, REJECTED, EXPIRED
    }
}

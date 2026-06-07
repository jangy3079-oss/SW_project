package com.donga.dating.domain.matching.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 매칭 노출 이력 엔티티
 *
 * 공강/일반/랭크 매칭에서:
 * - 거절된 후보자는 최소 7일간 재노출 금지
 * - 리롤로 패스된 후보자도 7일간 재노출 금지
 * - 24시간 타임아웃된 요청의 대상도 7일간 재노출 금지
 *
 * 동시성 보호: 낙관적 락 (version 필드)
 */
@Entity
@Table(name = "match_exposure_history", indexes = {
    @Index(name = "idx_exposure_expires", columnList = "source_user_id, expires_at"),
    @Index(name = "idx_exposure_target", columnList = "target_user_id, expires_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class MatchExposureHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exposure_id")
    private Long exposureId;

    /**
     * 매칭 요청을 보낸 사용자 (A)
     */
    @Column(name = "source_user_id", nullable = false)
    private Long sourceUserId;

    /**
     * 후보 대상 사용자 (B)
     */
    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    /**
     * 매칭 유형 (GENERAL, RANK, LECTURE)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false)
    private MatchType matchType;

    /**
     * 노출 제외 사유
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "exposure_reason", nullable = false)
    private ExposureReason exposureReason;

    /**
     * 노출 기록 생성 시각
     */
    @Column(name = "exposed_at", nullable = false)
    private LocalDateTime exposedAt;

    /**
     * 노출 제외 만료 시각 (7일 후)
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 낙관적 락용 버전
     */
    @Version
    private Long version;

    /**
     * 이력이 유효한지 확인 (현재 시간이 expiresAt을 초과했으면 만료)
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}


package com.donga.dating.domain.matching.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 남성 사용자 리롤 횟수 관리 엔티티
 *
 * 규칙:
 * - 매일 자정(00:00) 배치 시점에 3회로 '초기화(Reset)' (누적 아님)
 * - 리롤 사용 시마다 -1
 * - 매칭 배치는 여성에게만 3회 제한, 남성에게는 무제한
 *
 * 동시성 보호: 낙관적 락 (version 필드)
 */
@Entity
@Table(name = "reroll_counters", indexes = {
    @Index(name = "idx_reroll_reset", columnList = "reset_date")
})
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class RerollCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "counter_id")
    private Long counterId;

    /**
     * 남성 사용자 ID (여성은 무제한이므로 미저장)
     */
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    /**
     * 남은 리롤 횟수 (매일 자정에 3으로 초기화)
     */
    @Column(name = "remaining_rerolls", nullable = false)
    private Integer remainingRerolls;

    /**
     * 마지막 초기화 날짜 (자정 배치 실행 일자)
     */
    @Column(name = "reset_date", nullable = false)
    private LocalDate resetDate;

    /**
     * 마지막 업데이트 시각
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 낙관적 락용 버전
     */
    @Version
    private Long version;

    /**
     * 리롤 횟수 감소 (사용)
     *
     * @return 리롤 사용 후 남은 횟수
     * @throws IllegalStateException 리롤 횟수 부족 시
     */
    public Integer useReroll() {
        if (remainingRerolls <= 0) {
            throw new IllegalStateException("리롤 횟수가 부족합니다");
        }
        this.remainingRerolls--;
        this.updatedAt = LocalDateTime.now();
        return this.remainingRerolls;
    }

    /**
     * 오늘 초기화했는지 확인
     *
     * @return true if not reset today
     */
    public boolean shouldResetToday() {
        return !resetDate.equals(LocalDate.now());
    }

    /**
     * 자정 배치에 의해 초기화
     */
    public void resetByBatch() {
        this.remainingRerolls = 3;
        this.resetDate = LocalDate.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 리롤 가능 여부
     */
    public boolean canReroll() {
        return remainingRerolls > 0;
    }
}


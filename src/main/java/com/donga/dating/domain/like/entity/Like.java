package com.donga.dating.domain.like.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "likes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Like {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long likeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;

    /**
     * 좋아요 만료 시각 (PENDING 상태에서 24시간 또는 랭크 매칭 60초 등)
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * 낙관적 락 버전
     */
    @Version
    private Long version;

    public enum Status {
        PENDING,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        CANCELLED_BY_SENDER,
        AUTO_REJECTED
    }

    // 비즈니스 메서드
    public void accept() {
        this.status = Status.ACCEPTED;
    }

    public void reject() {
        this.status = Status.REJECTED;
    }

    public void expire() {
        this.status = Status.EXPIRED;
    }

    public void cancelBySender() {
        this.status = Status.CANCELLED_BY_SENDER;
    }

    public void autoReject() {
        this.status = Status.AUTO_REJECTED;
    }

    // 편의 접근자
    public Long getSenderId() {
        return sender != null ? sender.getUserId() : null;
    }

    public Long getReceiverId() {
        return receiver != null ? receiver.getUserId() : null;
    }
}

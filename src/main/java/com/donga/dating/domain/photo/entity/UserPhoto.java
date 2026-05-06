package com.donga.dating.domain.photo.entity;

import com.donga.dating.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_photos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class UserPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long photoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fileName;        // UUID 기반 저장 파일명

    @Column(nullable = false, length = 500)
    private String filePath;        // 서버 절대 경로

    @Column(nullable = false)
    private String originalName;    // 원본 파일명

    @Column(nullable = false)
    private Long fileSize;          // bytes

    @Column(nullable = false)
    @Builder.Default
    private boolean isPrimary = false;

    @Column(nullable = false)
    @Builder.Default
    private byte photoOrder = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // ── 비즈니스 메서드 ──────────────────────────

    public void markAsPrimary() {
        this.isPrimary = true;
        this.photoOrder = 0;
    }

    public void unmarkPrimary() {
        this.isPrimary = false;
    }

    public void updateOrder(byte order) {
        this.photoOrder = order;
    }
}

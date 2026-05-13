package com.donga.dating.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 30)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, unique = true, length = 20)
    private String studentId;

    @Column(nullable = false, length = 50)
    private String department;

    @Column(nullable = false)
    private Byte grade;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rankScore = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RankTier rankTier = RankTier.BRONZE;

    @Column(nullable = false)
    @Builder.Default
    private int evalCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // ── 비즈니스 메서드 ──────────────────────────

    public void updateProfile(String name,
                              Gender gender,
                              LocalDate birthDate,
                              String studentId,
                              String department,
                              Byte grade,
                              String bio) {
        this.name = name;
        this.gender = gender;
        this.birthDate = birthDate;
        this.studentId = studentId;
        this.department = department;
        this.grade = grade;
        this.bio = bio;
    }

    public void updateBio(String bio) {
        this.bio = bio;
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    public void deactivate() {
        this.isActive = Boolean.FALSE;
    }

    // ── Enum ─────────────────────────────────────

    public enum Gender {
        MALE, FEMALE
    }

    public enum RankTier {
        BRONZE, SILVER, GOLD, PLATINUM, DIAMOND
    }
}

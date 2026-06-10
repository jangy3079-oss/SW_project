package com.donga.dating.domain.user.repository;

import com.donga.dating.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByStudentId(String studentId);

    boolean existsByEmail(String email);

    boolean existsByStudentId(String studentId);

    /**
     * 특정 성별 사용자 전체 조회 (공강/랭크 매칭용)
     */
    List<User> findAllByGender(User.Gender gender);

    /**
     * 활성 사용자 중 특정 성별 조회
     */
    @Query("SELECT u FROM User u WHERE u.gender = :gender AND u.isActive = true")
    List<User> findActiveByGender(@Param("gender") User.Gender gender);
}

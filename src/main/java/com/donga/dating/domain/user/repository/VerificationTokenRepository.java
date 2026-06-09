package com.donga.dating.domain.user.repository;

import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying; // [임포트 추가]
import org.springframework.transaction.annotation.Transactional; // [임포트 추가]

import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    /**
     * 유저 정보로 기존 인증 토큰 삭제
     * [보정 완료] @Modifying과 @Transactional을 부여하여 재발행 시
     * 데이터 변경이 영속성 컨텍스트 및 DB에 원자적으로 반영되도록 보장합니다.
     */
    @Modifying
    @Transactional
    void deleteByUser(User user);
}
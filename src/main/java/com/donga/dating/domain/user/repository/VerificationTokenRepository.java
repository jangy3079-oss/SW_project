package com.donga.dating.domain.user.repository;

import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
    void deleteByUser(User user);
}

package com.donga.dating.domain.chat.repository;

import com.donga.dating.domain.chat.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 사용자 차단 데이터 조회 Repository
 */
public interface BlockRepository extends JpaRepository<Block, Long> {

    /**
     * 이미 차단한 사용자인지 확인
     */
    boolean existsByBlocker_UserIdAndBlocked_UserId(Long blockerId, Long blockedId);

    /**
     * 차단한 사용자와 차단당한 사용자 기준으로 차단 기록 조회
     */
    Optional<Block> findByBlocker_UserIdAndBlocked_UserId(Long blockerId, Long blockedId);
}
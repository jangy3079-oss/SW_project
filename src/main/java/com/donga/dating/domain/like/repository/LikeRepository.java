package com.donga.dating.domain.like.repository;

import com.donga.dating.domain.like.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findBySender_UserIdAndReceiver_UserId(Long senderId, Long receiverId);
}

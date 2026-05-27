package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.matching.entity.UserLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLikeRepository extends JpaRepository<UserLike, Long> {

    Optional<UserLike> findByFromUserUserIdAndToUserUserId(Long fromUserId, Long toUserId);

    boolean existsByFromUserUserIdAndToUserUserId(Long fromUserId, Long toUserId);
}

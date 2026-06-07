package com.donga.dating.domain.matching.repository;

import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.entity.Like.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 좋아요 Repository
 */
@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    /**
     * 특정 발신자가 특정 수신자에게 보낸 좋아요 조회
     */
    Optional<Like> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    /**
     * 특정 수신자가 받은 PENDING 상태의 좋아요 목록
     */
    @Query("SELECT l FROM Like l " +
           "WHERE l.receiverId = :receiverId " +
           "  AND l.status = :status " +
           "ORDER BY l.createdAt DESC")
    List<Like> findPendingLikesByReceiver(@Param("receiverId") Long receiverId,
                                         @Param("status") Status status);

    /**
     * 24시간 타임아웃된 PENDING 좋아요 조회
     */
    @Query("SELECT l FROM Like l " +
           "WHERE l.status = :status " +
           "  AND l.expiresAt <= CURRENT_TIMESTAMP")
    List<Like> findExpiredPendingLikes(@Param("status") Status status);

    /**
     * 특정 발신자가 보낸 PENDING 상태 좋아요 모두 조회
     */
    @Query("SELECT l FROM Like l " +
           "WHERE l.senderId = :senderId " +
           "  AND l.status = :status")
    List<Like> findPendingLikesBySender(@Param("senderId") Long senderId,
                                        @Param("status") Status status);

    /**
     * 맞좋아요가 되었는지 확인
     * (A → B 좋아요 수락 AND B → A 좋아요 수락)
     */
    @Query("SELECT COUNT(l) FROM Like l " +
           "WHERE ((l.senderId = :userId1 AND l.receiverId = :userId2) OR " +
           "       (l.senderId = :userId2 AND l.receiverId = :userId1)) " +
           "  AND l.status = :status")
    long countMutualAccepts(@Param("userId1") Long userId1,
                           @Param("userId2") Long userId2,
                           @Param("status") Status status);

    /**
     * 특정 수신자가 받은 특정 상태의 좋아요 건수
     */
    long countByReceiverIdAndStatus(Long receiverId, Status status);
}



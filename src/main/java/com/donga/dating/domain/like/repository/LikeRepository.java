package com.donga.dating.domain.like.repository;

import com.donga.dating.domain.like.entity.Like;
import com.donga.dating.domain.like.entity.Like.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

    Optional<Like> findBySender_UserIdAndReceiver_UserId(Long senderId, Long receiverId);

    List<Like> findByReceiver_UserIdAndStatus(Long receiverId, Status status);

    List<Like> findBySender_UserIdAndStatus(Long senderId, Status status);

    @Query("SELECT l FROM Like l WHERE l.status = :status AND l.expiresAt <= CURRENT_TIMESTAMP")
    List<Like> findExpiredPendingLikes(@Param("status") Status status);

    @Query("SELECT COUNT(l) FROM Like l " +
           "WHERE ((l.sender.userId = :userId1 AND l.receiver.userId = :userId2) OR " +
           "       (l.sender.userId = :userId2 AND l.receiver.userId = :userId1)) " +
           "  AND l.status = :status")
    long countMutualAccepts(@Param("userId1") Long userId1,
                            @Param("userId2") Long userId2,
                            @Param("status") Status status);

    long countByReceiver_UserIdAndStatus(Long receiverId, Status status);

    // convenience methods matching previous matching-service expectations
    default Optional<Like> findBySenderIdAndReceiverId(Long senderId, Long receiverId) {
        return findBySender_UserIdAndReceiver_UserId(senderId, receiverId);
    }

    default List<Like> findPendingLikesByReceiver(Long receiverId, Status status) {
        return findByReceiver_UserIdAndStatus(receiverId, status);
    }

    default List<Like> findPendingLikesBySender(Long senderId, Status status) {
        return findBySender_UserIdAndStatus(senderId, status);
    }
}

package com.donga.dating.domain.chat.repository;

import com.donga.dating.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 채팅방 데이터 조회 Repository
 */
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    /**
     * 매칭 고유 번호로 채팅방 조회
     */
    Optional<ChatRoom> findByMatch_MatchId(Long matchId);

    /**
     * 특정 사용자가 참여한 채팅방 목록 조회
     */
    List<ChatRoom> findByMatch_MaleUser_UserIdOrMatch_FemaleUser_UserId(
            Long maleUserId,
            Long femaleUserId
    );
}
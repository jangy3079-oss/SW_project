package com.donga.dating.domain.chat.service;

import com.donga.dating.domain.chat.dto.ChatMessageRequest;
import com.donga.dating.domain.chat.dto.ChatMessageResponse;
import com.donga.dating.domain.chat.entity.ChatMessage;
import com.donga.dating.domain.chat.entity.ChatRoom;
import com.donga.dating.domain.chat.entity.ChatRoomStatus;
import com.donga.dating.domain.chat.repository.ChatMessageRepository;
import com.donga.dating.domain.chat.repository.ChatRoomRepository;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.repository.MatchRepository;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.donga.dating.domain.chat.dto.ChatRoomResponse;
import com.donga.dating.domain.chat.entity.Block;
import com.donga.dating.domain.chat.repository.BlockRepository;
import com.donga.dating.domain.chat.dto.ReportRequest;
import com.donga.dating.domain.chat.entity.Report;
import com.donga.dating.domain.chat.repository.ReportRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 채팅 서비스
 *
 * - 매칭된 사용자만 채팅 가능
 * - 채팅방 생성 또는 조회
 * - 메시지 전송
 * - 메시지 목록 조회
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final ReportRepository reportRepository;

    /**
     * 메시지 전송
     */
    @Transactional
    public ChatMessageResponse sendMessage(
            Long matchId,
            Long senderId,
            ChatMessageRequest request
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        validateMatchedUser(match, senderId);

        ChatRoom room = getOrCreateChatRoom(match);

        if (room.getStatus() != ChatRoomStatus.ACTIVE) {
            throw new IllegalStateException("현재 채팅할 수 없는 채팅방입니다.");
        }

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(request.getContent())
                .isRead(false)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        chatMessageRepository.save(message);

        return toResponse(message);
    }

    /**
     * 메시지 목록 조회
     */
    public List<ChatMessageResponse> getMessages(Long matchId, Long userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, userId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        return chatMessageRepository
                .findByRoomAndIsDeletedFalseOrderByCreatedAtAsc(room)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 채팅방이 없으면 새로 만들고, 있으면 기존 채팅방 반환
     */
    private ChatRoom getOrCreateChatRoom(Match match) {
        return chatRoomRepository.findByMatch_MatchId(match.getMatchId())
                .orElseGet(() -> {
                    ChatRoom room = ChatRoom.builder()
                            .match(match)
                            .status(ChatRoomStatus.ACTIVE)
                            .createdAt(LocalDateTime.now())
                            .build();

                    return chatRoomRepository.save(room);
                });
    }

    /**
     * 요청한 사용자가 해당 매칭의 남자 또는 여자 사용자인지 확인
     */
    private void validateMatchedUser(Match match, Long userId) {
        Long maleUserId = match.getMaleUser().getUserId();
        Long femaleUserId = match.getFemaleUser().getUserId();

        if (!userId.equals(maleUserId) && !userId.equals(femaleUserId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }

    /**
     * 메시지 응답 형태로 변환
     */
    private ChatMessageResponse toResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .messageId(message.getMessageId())
                .senderId(message.getSender().getUserId())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }

    /**
     * 메시지 읽음 처리
     * - 현재 로그인한 사용자가 상대방 메시지를 읽었을 때 사용
     * - 내가 보낸 메시지는 읽음 처리하지 않음
     */
    @Transactional
    public void readMessages(Long matchId, Long userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, userId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        List<ChatMessage> unreadMessages =
                chatMessageRepository.findByRoomAndSender_UserIdNotAndIsReadFalse(room, userId);

        for (ChatMessage message : unreadMessages) {
            message.setIsRead(true);
        }
    }

    /**
     * 안 읽은 메시지 개수 조회
     * - 현재 로그인한 사용자가 읽지 않은 상대방 메시지만 계산
     */
    public long getUnreadCount(Long matchId, Long userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, userId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        return chatMessageRepository.countByRoomAndSender_UserIdNotAndIsReadFalse(room, userId);
    }

    /**
     * 최근 메시지 조회
     */
    public ChatMessageResponse getLatestMessage(Long matchId, Long userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, userId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        ChatMessage latestMessage = chatMessageRepository
                .findTopByRoomAndIsDeletedFalseOrderByCreatedAtDesc(room)
                .orElseThrow(() -> new IllegalStateException("최근 메시지가 없습니다."));

        return toResponse(latestMessage);
    }

    /**
     * 내 채팅방 목록 조회
     * - 내가 참여한 모든 채팅방 조회
     * - 상대방 이름, 최근 메시지, 안 읽은 메시지 개수 포함
     */
    public List<ChatRoomResponse> getMyChatRooms(Long userId) {
        List<ChatRoom> rooms =
                chatRoomRepository.findByMatch_MaleUser_UserIdOrMatch_FemaleUser_UserId(
                        userId,
                        userId
                );

        return rooms.stream()
                .map(room -> {
                    Long maleUserId = room.getMatch().getMaleUser().getUserId();
                    Long femaleUserId = room.getMatch().getFemaleUser().getUserId();

                    String opponentName;

                    if (userId.equals(maleUserId)) {
                        opponentName = room.getMatch().getFemaleUser().getName();
                    } else {
                        opponentName = room.getMatch().getMaleUser().getName();
                    }

                    String latestMessage = chatMessageRepository
                            .findTopByRoomAndIsDeletedFalseOrderByCreatedAtDesc(room)
                            .map(ChatMessage::getContent)
                            .orElse("");

                    long unreadCount =
                            chatMessageRepository.countByRoomAndSender_UserIdNotAndIsReadFalse(
                                    room,
                                    userId
                            );

                    return ChatRoomResponse.builder()
                            .roomId(room.getRoomId())
                            .matchId(room.getMatch().getMatchId())
                            .opponentName(opponentName)
                            .latestMessage(latestMessage)
                            .unreadCount(unreadCount)
                            .status(room.getStatus())
                            .build();
                })
                .toList();
    }

    /**
     * 메시지 삭제
     * - 메시지를 보낸 사용자만 삭제 가능
     * - 실제 데이터 삭제가 아니라 삭제 여부만 true로 변경
     */
    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalStateException("메시지가 존재하지 않습니다."));

        Long senderId = message.getSender().getUserId();

        if (!userId.equals(senderId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        message.setIsDeleted(true);
    }

    /**
     * 사용자 차단
     * - 매칭된 상대방만 차단 가능
     * - 차단 기록 저장
     * - 채팅방 상태를 BLOCKED로 변경
     */
    @Transactional
    public void blockUser(Long matchId, Long blockerId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, blockerId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        User blocked = getOpponentUser(match, blockerId);

        boolean alreadyBlocked =
                blockRepository.existsByBlocker_UserIdAndBlocked_UserId(
                        blocker.getUserId(),
                        blocked.getUserId()
                );

        if (alreadyBlocked) {
            throw new IllegalStateException("이미 차단한 사용자입니다.");
        }

        Block block = Block.builder()
                .blocker(blocker)
                .blocked(blocked)
                .createdAt(LocalDateTime.now())
                .build();

        blockRepository.save(block);

        room.changeStatus(ChatRoomStatus.BLOCKED);
    }

    /**
     * 사용자 차단 해제
     * - 차단 기록 삭제
     * - 채팅방 상태를 ACTIVE로 변경
     */
    @Transactional
    public void unblockUser(Long matchId, Long blockerId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, blockerId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        User blocked = getOpponentUser(match, blockerId);

        Block block = blockRepository
                .findByBlocker_UserIdAndBlocked_UserId(blockerId, blocked.getUserId())
                .orElseThrow(() -> new IllegalStateException("차단 기록이 존재하지 않습니다."));

        blockRepository.delete(block);

        room.changeStatus(ChatRoomStatus.ACTIVE);
    }

    /**
     * 매칭 상대방 사용자 조회
     */
    private User getOpponentUser(Match match, Long userId) {
        Long maleUserId = match.getMaleUser().getUserId();

        if (userId.equals(maleUserId)) {
            return match.getFemaleUser();
        }

        return match.getMaleUser();
    }

    /**
     * 사용자 신고
     * - 매칭된 상대방만 신고 가능
     * - 신고 기록을 reports 테이블에 저장
     */
    @Transactional
    public void reportUser(Long matchId, Long reporterId, ReportRequest request) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, reporterId);

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        User reported = getOpponentUser(match, reporterId);

        Report report = Report.builder()
                .reporter(reporter)
                .reported(reported)
                .reason(request.getReason())
                .createdAt(LocalDateTime.now())
                .build();

        reportRepository.save(report);
    }

    /**
     * 채팅방 종료
     * - 매칭 종료, 평가 완료, 기간 만료 등으로 더 이상 채팅할 수 없게 처리
     */
    @Transactional
    public void closeChatRoom(Long matchId, Long userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new CustomException(ErrorCode.MATCH_NOT_FOUND));

        validateMatchedUser(match, userId);

        ChatRoom room = chatRoomRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new IllegalStateException("채팅방이 존재하지 않습니다."));

        room.changeStatus(ChatRoomStatus.CLOSED);
    }
}
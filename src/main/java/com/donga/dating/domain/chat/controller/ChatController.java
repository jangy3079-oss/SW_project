package com.donga.dating.domain.chat.controller;

import com.donga.dating.domain.chat.dto.ChatMessageRequest;
import com.donga.dating.domain.chat.dto.ChatMessageResponse;
import com.donga.dating.domain.chat.service.ChatService;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import com.donga.dating.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.donga.dating.domain.chat.dto.ChatRoomResponse;
import com.donga.dating.domain.chat.dto.ReportRequest;

import java.util.List;

/**
 * 채팅 API
 * - JWT 인증 기반 사용자 식별
 * - 매칭된 사용자만 메시지 전송 가능
 * - 매칭된 사용자만 메시지 조회 가능
 */
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    /**
     * 메시지 전송
     */
    @PostMapping("/matches/{matchId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long matchId,
            @RequestBody ChatMessageRequest request
    ) {
        Long senderId = getLoginUserId();

        ChatMessageResponse response =
                chatService.sendMessage(matchId, senderId, request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 메시지 목록 조회
     */
    @GetMapping("/matches/{matchId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        List<ChatMessageResponse> response =
                chatService.getMessages(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * JWT에서 현재 로그인한 사용자의 이메일을 가져온 뒤
     * 사용자 테이블에서 사용자 번호를 조회
     */
    private Long getLoginUserId() {
        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        String email = auth.getPrincipal().toString();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return user.getUserId();
    }

    /**
     * 메시지 읽음 처리
     */
    @PatchMapping("/matches/{matchId}/read")
    public ResponseEntity<ApiResponse<String>> readMessages(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        chatService.readMessages(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success("메시지 읽음 처리 완료"));
    }

    /**
     * 안 읽은 메시지 개수 조회
     */
    @GetMapping("/matches/{matchId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        long unreadCount = chatService.getUnreadCount(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success(unreadCount));
    }

    /**
     * 최근 메시지 조회
     */
    @GetMapping("/matches/{matchId}/latest-message")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> getLatestMessage(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        ChatMessageResponse response =
                chatService.getLatestMessage(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 내 채팅방 목록 조회
     */
    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getMyChatRooms() {
        Long userId = getLoginUserId();

        List<ChatRoomResponse> response =
                chatService.getMyChatRooms(userId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 메시지 삭제
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<String>> deleteMessage(
            @PathVariable Long messageId
    ) {
        Long userId = getLoginUserId();

        chatService.deleteMessage(messageId, userId);

        return ResponseEntity.ok(ApiResponse.success("메시지 삭제 완료"));
    }

    /**
     * 사용자 차단
     */
    @PostMapping("/matches/{matchId}/block")
    public ResponseEntity<ApiResponse<String>> blockUser(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        chatService.blockUser(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success("사용자 차단 완료"));
    }

    /**
     * 사용자 차단 해제
     */
    @DeleteMapping("/matches/{matchId}/block")
    public ResponseEntity<ApiResponse<String>> unblockUser(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        chatService.unblockUser(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success("사용자 차단 해제 완료"));
    }

    /**
     * 사용자 신고
     */
    @PostMapping("/matches/{matchId}/report")
    public ResponseEntity<ApiResponse<String>> reportUser(
            @PathVariable Long matchId,
            @RequestBody ReportRequest request
    ) {
        Long userId = getLoginUserId();

        chatService.reportUser(matchId, userId, request);

        return ResponseEntity.ok(ApiResponse.success("사용자 신고 완료"));
    }

    /**
     * 채팅방 종료
     */
    @PatchMapping("/matches/{matchId}/close")
    public ResponseEntity<ApiResponse<String>> closeChatRoom(
            @PathVariable Long matchId
    ) {
        Long userId = getLoginUserId();

        chatService.closeChatRoom(matchId, userId);

        return ResponseEntity.ok(ApiResponse.success("채팅방 종료 완료"));
    }
}
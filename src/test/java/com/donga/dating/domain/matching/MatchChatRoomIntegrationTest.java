package com.donga.dating.domain.matching;

import com.donga.dating.domain.chat.entity.ChatRoom;
import com.donga.dating.domain.chat.entity.ChatRoomStatus;
import com.donga.dating.domain.chat.repository.ChatRoomRepository;
import com.donga.dating.domain.like.dto.LikeResponse;
import com.donga.dating.domain.like.service.LikeService;
import com.donga.dating.domain.matching.dto.MatchResponse;
import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.matching.service.MatchingService;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.integration.support.locks.LockRegistry;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 매칭 성사(LikeService.acceptHeart → Match 생성) 시
 * ChatService가 채팅방을 자동으로 생성하는지 검증하는 통합 테스트.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MatchChatRoomIntegrationTest {

    @Autowired
    private LikeService likeService;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @MockBean
    private RedisConnectionFactory redisConnectionFactory;

    @MockBean
    private LockRegistry lockRegistry;

    @MockBean
    private JavaMailSender javaMailSender;

    @Test
    @DisplayName("매칭 성사 시 채팅방이 자동으로 생성된다")
    void whenMatchSucceeds_chatRoomIsCreatedAutomatically() {
        User male = createUser("M001", User.Gender.MALE);
        User female = createUser("F001", User.Gender.FEMALE);

        DayOfWeek lectureDay = DayOfWeek.MONDAY;
        LocalTime start = LocalTime.of(10, 0);
        LocalTime end = LocalTime.of(12, 0);

        matchingService.enterQueue(male.getUserId(), Match.MatchType.LECTURE, lectureDay, start, end);
        matchingService.enterQueue(female.getUserId(), Match.MatchType.LECTURE, lectureDay,
                LocalTime.of(11, 0), LocalTime.of(13, 0));

        LikeResponse heart = likeService.sendHeart(male.getUserId(), female.getUserId());
        MatchResponse matchResponse = likeService.acceptHeart(heart.getLikeId());

        ChatRoom chatRoom = chatRoomRepository.findByMatch_MatchId(matchResponse.getMatchId())
                .orElseThrow(() -> new AssertionError("매칭 성사 후 채팅방이 생성되어야 합니다"));

        assertThat(chatRoom.getStatus()).isEqualTo(ChatRoomStatus.ACTIVE);
        assertThat(chatRoom.getMatch().getMatchId()).isEqualTo(matchResponse.getMatchId());
        assertThat(chatRoom.getMatch().getMaleUser().getUserId()).isEqualTo(male.getUserId());
        assertThat(chatRoom.getMatch().getFemaleUser().getUserId()).isEqualTo(female.getUserId());
    }

    private User createUser(String studentSuffix, User.Gender gender) {
        return userRepository.save(User.builder()
                .email(studentSuffix + "@donga.ac.kr")
                .password("encoded-password")
                .name("테스트" + studentSuffix)
                .gender(gender)
                .birthDate(LocalDate.of(2002, 3, 15))
                .studentId("2024" + studentSuffix)
                .department("컴퓨터공학과")
                .grade((byte) 2)
                .isActive(true)
                .build());
    }
}

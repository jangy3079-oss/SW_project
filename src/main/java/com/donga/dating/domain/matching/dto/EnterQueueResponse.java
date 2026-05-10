package com.donga.dating.domain.matching.dto;

import com.donga.dating.domain.matching.entity.Match;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EnterQueueResponse {

    private boolean matched;
    private Long matchId;
    private Long partnerId;
    private String partnerName;
    private String matchType;
    private LocalDateTime expiresAt;
    private String message;

    /** 대기열 등록 (즉시 매칭 없음) */
    public static EnterQueueResponse queued(Match.MatchType matchType) {
        return EnterQueueResponse.builder()
                .matched(false)
                .matchType(matchType.name())
                .message("대기열에 등록되었습니다.")
                .build();
    }

    /** 즉시 매칭 성공 */
    public static EnterQueueResponse matched(Match match, Long myUserId) {
        boolean isMale = match.getMaleUser().getUserId().equals(myUserId);
        var partner = isMale ? match.getFemaleUser() : match.getMaleUser();

        return EnterQueueResponse.builder()
                .matched(true)
                .matchId(match.getMatchId())
                .partnerId(partner.getUserId())
                .partnerName(partner.getName())
                .matchType(match.getMatchType().name())
                .expiresAt(match.getExpiresAt())
                .message("매칭이 완료되었습니다!")
                .build();
    }
}

package com.donga.dating.domain.matching.dto;

import com.donga.dating.domain.matching.entity.Match;
import com.donga.dating.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MatchResponse {

    private Long matchId;
    private Long partnerId;
    private String partnerName;
    private String partnerGender;
    private String matchType;
    private String status;
    private LocalDateTime matchedAt;
    private LocalDateTime expiresAt;

    public static MatchResponse from(Match match, Long myUserId) {
        boolean isMale = match.getMaleUser().getUserId().equals(myUserId);
        User partner = isMale ? match.getFemaleUser() : match.getMaleUser();

        return MatchResponse.builder()
                .matchId(match.getMatchId())
                .partnerId(partner.getUserId())
                .partnerName(partner.getName())
                .partnerGender(partner.getGender().name())
                .matchType(match.getMatchType().name())
                .status(match.getStatus().name())
                .matchedAt(match.getMatchedAt())
                .expiresAt(match.getExpiresAt())
                .build();
    }
}

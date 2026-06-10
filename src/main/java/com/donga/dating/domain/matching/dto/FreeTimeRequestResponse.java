package com.donga.dating.domain.matching.dto;

import com.donga.dating.domain.matching.entity.FreeTimeRequest;
import com.donga.dating.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
public class FreeTimeRequestResponse {

    private Long requestId;
    private Long partnerId;
    private String partnerName;
    private String partnerGender;
    private LocalDate matchedDate;
    private LocalTime overlapStart;
    private LocalTime overlapEnd;
    private String status;

    public static FreeTimeRequestResponse from(FreeTimeRequest req, Long myUserId) {
        boolean isMale = req.getMaleUser().getUserId().equals(myUserId);
        User partner = isMale ? req.getFemaleUser() : req.getMaleUser();

        return FreeTimeRequestResponse.builder()
                .requestId(req.getRequestId())
                .partnerId(partner.getUserId())
                .partnerName(partner.getName())
                .partnerGender(partner.getGender().name())
                .matchedDate(req.getMatchedDate())
                .overlapStart(req.getOverlapStart())
                .overlapEnd(req.getOverlapEnd())
                .status(req.getStatus().name())
                .build();
    }
}

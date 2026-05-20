package com.donga.dating.domain.chat.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 신고 요청
 */
@Getter
@Setter
public class ReportRequest {

    /**
     * 신고 사유
     */
    private String reason;
}
package com.donga.dating.domain.matching.entity;

/**
 * 매칭 노출 이력 제외 사유
 */
public enum ExposureReason {
    /**
     * 사용자가 거절한 경우
     */
    REJECTED("거절"),

    /**
     * 사용자가 리롤로 패스한 경우
     */
    REROLL_PASS("리롤패스"),

    /**
     * 기존 요청이 24시간 만료된 경우
     */
    EXPIRED("만료");

    private final String displayName;

    ExposureReason(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}


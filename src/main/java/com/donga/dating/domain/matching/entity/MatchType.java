package com.donga.dating.domain.matching.entity;

/**
 * 매칭 타입 열거형
 */
public enum MatchType {
    /**
     * 일반 매칭: 공강 시간 기반 매칭
     */
    GENERAL("일반매칭"),

    /**
     * 랭크 매칭: 실시간 rankScore 기반 매칭
     */
    RANK("랭크매칭"),

    /**
     * 강의 매칭: 공강이 정해진 시간 기반 매칭
     */
    LECTURE("강의매칭");

    private final String displayName;

    MatchType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}


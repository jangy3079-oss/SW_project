package com.donga.dating.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),
    INVALID_JSON(HttpStatus.BAD_REQUEST, "잘못된 JSON 형식입니다."),

    // 사용자
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    STUDENT_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 학번입니다."),
    INVALID_DONGA_EMAIL(HttpStatus.BAD_REQUEST, "동아대학교 이메일(@donga.ac.kr)만 허용됩니다."),
    INVALID_TOKEN(HttpStatus.BAD_REQUEST, "잘못된 토큰입니다."),
    TOKEN_EXPIRED(HttpStatus.BAD_REQUEST, "토큰이 만료되었습니다."),
    ALREADY_VERIFIED(HttpStatus.CONFLICT, "이미 인증된 계정입니다."),
    PROFILE_NOT_ACTIVE(HttpStatus.BAD_REQUEST, "프로필이 공개 상태가 아니어서 접근할 수 없습니다."),
    INVALID_MATCH_CONDITION(HttpStatus.BAD_REQUEST, "매칭 조건이 충족되지 않습니다."),


    // 사진
    PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다."),
    PHOTO_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "사진은 최대 5장까지 등록할 수 있습니다."),
    EMPTY_FILE(HttpStatus.BAD_REQUEST, "파일이 비어있습니다."),
    INVALID_FILE(HttpStatus.BAD_REQUEST, "올바르지 않은 파일입니다."),
    UNSUPPORTED_FILE_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 파일 형식입니다. (jpg, jpeg, png, webp)"),
    FILE_SAVE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다."),

    // 매칭
    ALREADY_IN_QUEUE(HttpStatus.CONFLICT, "이미 대기열에 등록되어 있습니다."),
    QUEUE_NOT_FOUND(HttpStatus.NOT_FOUND, "대기열을 찾을 수 없습니다."),
    MATCH_NOT_FOUND(HttpStatus.NOT_FOUND, "매칭을 찾을 수 없습니다."),
    MATCH_ALREADY_CLOSED(HttpStatus.BAD_REQUEST, "이미 종료된 매칭입니다."),
    MATCH_NOT_PENDING(HttpStatus.BAD_REQUEST, "수락/거절 대기 중인 매칭이 아닙니다."),
    MATCH_NOT_PARTICIPANT(HttpStatus.FORBIDDEN, "해당 매칭의 참여자가 아닙니다."),
    TIMETABLE_NOT_REGISTERED(HttpStatus.BAD_REQUEST, "공강 시간표를 먼저 등록해야 합니다."),

    // 평가
    ALREADY_EVALUATED(HttpStatus.CONFLICT, "이미 평가를 완료했습니다."),
    INVALID_SCORE(HttpStatus.BAD_REQUEST, "평가 점수는 1~5점이어야 합니다."),
    EVALUATION_ALREADY_SUBMITTED(HttpStatus.CONFLICT, "이미 평가를 제출했습니다."),

    // 시간표
    TIMETABLE_ANALYSIS_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "시간표 분석에 실패했습니다."),
    TIMETABLE_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "시간표 분석 서버에 연결할 수 없습니다."),

    // 하트/좋아요
    LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "좋아요(하트)를 찾을 수 없습니다."),
    ALREADY_SENT_HEART(HttpStatus.CONFLICT, "이미 해당 사용자에게 하트를 보냈습니다."),
    LIKE_ALREADY_PROCESSED(HttpStatus.CONFLICT, "이미 처리된 하트입니다."),
    LIKE_NOT_MUTUAL_ACCEPTED(HttpStatus.BAD_REQUEST, "양측 모두 수락한 좋아요만 채팅방을 만들 수 있습니다."),

    // 리롤
    REROLL_COUNTER_NOT_FOUND(HttpStatus.NOT_FOUND, "리롤 카운터를 찾을 수 없습니다."),
    REROLL_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "리롤 횟수를 다 사용했습니다. 내일 다시 시도해주세요."),

    // 랭크 매칭
    RANK_MATCHING_TIMEOUT(HttpStatus.BAD_REQUEST, "랭크 매칭 대기 시간이 초과했습니다. (최대 5분)"),
    CONCURRENT_REQUEST_FAILED(HttpStatus.BAD_REQUEST, "동시 요청으로 인한 실패입니다. 다시 시도해주세요."),

    // 배치
    BATCH_EXECUTION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "배치 작업 실행에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}

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

    // 사용자
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    STUDENT_ID_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 학번입니다."),
    INVALID_DONGA_EMAIL(HttpStatus.BAD_REQUEST, "동아대학교 이메일(@donga.ac.kr)만 허용됩니다."),

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

    // 평가
    ALREADY_EVALUATED(HttpStatus.CONFLICT, "이미 평가를 완료했습니다."),
    INVALID_SCORE(HttpStatus.BAD_REQUEST, "평가 점수는 1~5점이어야 합니다.");

    private final HttpStatus httpStatus;
    private final String message;
}

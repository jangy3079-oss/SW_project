package com.donga.dating.domain.user.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * [로그인 요청 DTO]
 * 클라이언트가 로그인 시 서버로 전달하는 데이터 구조
 * - 이메일 + 비밀번호로 인증 진행 예정
 */
@Getter
@Setter
public class LoginRequest {

    /** 로그인용 이메일 */
    private String email;

    /** 로그인용 비밀번호 */
    private String password;
}
package com.donga.dating.domain.user.dto;

import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.entity.User.Gender;
import lombok.*;

import java.time.LocalDate;

/**
 * [회원가입 요청 DTO]
 * User Entity와 1:1로 맞춘 구조
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private String name;
    private String studentId;
    private String department;
    private Byte grade;
    private LocalDate birthDate;
    private User.Gender gender;
}
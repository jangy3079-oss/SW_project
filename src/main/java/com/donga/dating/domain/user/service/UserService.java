package com.donga.dating.domain.user.service;

import com.donga.dating.domain.user.dto.RegisterRequest;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * [UserService]
 * - 사용자 조회
 * - 자기소개 수정
 * - 회원가입
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    // =========================
    // 회원가입 (추가됨)
    // =========================
    @Transactional
    public void register(RegisterRequest request) {


        // 1. 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 2. 학번 중복 체크
        if (userRepository.existsByStudentId(request.getStudentId())) {
            throw new CustomException(ErrorCode.STUDENT_ID_ALREADY_EXISTS);
        }

        // 3. User 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .studentId(request.getStudentId())
                .department(request.getDepartment())
                .grade(request.getGrade())
                .build();

        // 4. DB 저장
        userRepository.save(user);
    }

    // =========================
    // 사용자 조회 (기존 유지)
    // =========================
    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    // =========================
    // 자기소개 수정 (기존 유지)
    // =========================
    @Transactional
    public void updateBio(Long userId, String bio) {
        User user = getUser(userId);
        user.updateBio(bio);
    }
}
package com.donga.dating.domain.user.service;

import com.donga.dating.domain.user.dto.RegisterRequest;
import com.donga.dating.domain.user.entity.User;
import com.donga.dating.domain.user.entity.VerificationToken;
import com.donga.dating.domain.user.repository.UserRepository;
import com.donga.dating.domain.user.repository.VerificationTokenRepository;
import com.donga.dating.global.exception.CustomException;
import com.donga.dating.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
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
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

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
                .emailVerified(false)
                .build();

        // 4. DB 저장
        User savedUser = userRepository.save(user);

        // 인증 토큰 생성 및 이메일 발송
        createVerificationToken(savedUser);
    }

    public void createVerificationToken(User user) {
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(user, token, LocalDateTime.now().plusHours(24));
        verificationTokenRepository.save(verificationToken);

        String link = "http://localhost:8080/api/users/verify?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), link);
    }

    @Transactional
    public boolean verifyToken(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_TOKEN));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.TOKEN_EXPIRED);
        }

        User user = verificationToken.getUser();
        user.verifyEmail();
        userRepository.save(user);

        return true;
    }

    @Transactional
    public void resendVerificationToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new CustomException(ErrorCode.ALREADY_VERIFIED);
        }

        verificationTokenRepository.deleteByUser(user);

        String newToken = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(user, newToken, LocalDateTime.now().plusHours(24));
        verificationTokenRepository.save(verificationToken);

        String link = "http://localhost:8080/api/users/verify?token=" + newToken;
        emailService.sendVerificationEmail(user.getEmail(), link);
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
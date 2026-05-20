package com.donga.dating.domain.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String link) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("동아대 이메일 인증");
        message.setText("아래 링크를 클릭하여 이메일 인증을 완료해주세요:\n" + link);
        mailSender.send(message);
    }
}

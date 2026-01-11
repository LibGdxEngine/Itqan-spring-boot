package com.itqan.edu.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@itqan.edu}")
    private String fromEmail;

    @Value("${app.name:Itqan Education}")
    private String appName;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(appName + " - Password Reset OTP");
            message.setText(buildOtpEmailContent(otp));
            
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildOtpEmailContent(String otp) {
        return """
            Hello,
            
            You have requested to reset your password for your %s account.
            
            Your OTP code is: %s
            
            This code will expire in 15 minutes.
            
            If you did not request this password reset, please ignore this email.
            
            Best regards,
            %s Team
            """.formatted(appName, otp, appName);
    }
}

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

    /**
     * Tells a student whether their scholarship request was approved. Never throws: a mail
     * failure must not undo the decision that was already saved.
     */
    public void sendScholarshipDecision(String toEmail, String courseTitle, boolean approved, String note) {
        String noteAr = note == null || note.isBlank() ? "" : "\nملاحظة من الإدارة: " + note.trim() + "\n";
        String noteEn = note == null || note.isBlank() ? "" : "\nNote from the academy: " + note.trim() + "\n";
        String body = approved
                ? """
                  السلام عليكم ورحمة الله،

                  يسعدنا إبلاغك بقبول طلب المنحة الخاص بدورة «%1$s». تمت إضافة الدورة إلى حسابك، ويمكنك البدء من صفحة «دوراتي».
                  %2$s
                  نسأل الله لك التوفيق والسداد.
                  فريق %4$s

                  ---

                  Your scholarship request for "%1$s" has been approved. The course is now in your account under My Courses.
                  %3$s
                  """
                : """
                  السلام عليكم ورحمة الله،

                  شكرًا لتقديمك طلب منحة لدورة «%1$s». نعتذر عن عدم قبول الطلب في الوقت الحالي، ويمكنك التقديم مرة أخرى لاحقًا.
                  %2$s
                  فريق %4$s

                  ---

                  Thank you for applying for a scholarship for "%1$s". We are unable to approve the request at this time; you are welcome to apply again later.
                  %3$s
                  """;
        sendQuietly(toEmail, appName + " - " + (approved ? "تم قبول طلب المنحة" : "بخصوص طلب المنحة"),
                body.formatted(courseTitle, noteAr, noteEn, appName));
    }

    /** Thanks a donor for a completed donation to the scholarship fund. Never throws. */
    public void sendDonationReceipt(String toEmail, String donorName, String amount) {
        String name = donorName == null || donorName.isBlank() ? "" : " " + donorName.trim();
        String body = """
                السلام عليكم ورحمة الله%1$s،

                جزاك الله خيرًا على تبرعك بمبلغ %2$s لصندوق المنح الدراسية في %3$s.
                سيُستخدم تبرعك لتغطية رسوم الدورات لطلاب العلم غير القادرين على دفعها.
                تقبّل الله منك وجعله في ميزان حسناتك.

                ---

                Thank you for your donation of %2$s to the %3$s scholarship fund. It will cover course fees for students who cannot afford them.
                """.formatted(name, amount, appName);
        sendQuietly(toEmail, appName + " - شكرًا لتبرعك", body);
    }

    private void sendQuietly(String toEmail, String subject, String text) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email '{}' to {}", subject, toEmail, e);
        }
    }
}

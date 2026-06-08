package com.itqan.edu.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Authentication & Authorization
    UNAUTHORIZED(401, "AUTH_001", "Unauthorized access"),
    FORBIDDEN(403, "AUTH_002", "Access forbidden"),
    INVALID_CREDENTIALS(401, "AUTH_003", "Invalid email or password"),
    TOKEN_EXPIRED(401, "AUTH_004", "Token has expired"),
    TOKEN_INVALID(401, "AUTH_005", "Invalid token"),

    // Validation
    VALIDATION_ERROR(400, "VAL_001", "Validation failed"),

    // Not Found
    USER_NOT_FOUND(404, "USR_001", "User not found"),
    COURSE_NOT_FOUND(404, "CRS_001", "Course not found"),
    STUDENT_NOT_FOUND(404, "STU_001", "Student not found"),
    MODULE_NOT_FOUND(404, "CRS_002", "Module not found"),
    LESSON_NOT_FOUND(404, "CRS_003", "Lesson not found"),
    CLIP_NOT_FOUND(404, "CLP_001", "Clip not found"),
    ARTICLE_NOT_FOUND(404, "ART_001", "Article not found"),

    ENROLLMENT_NOT_FOUND(404, "ENR_001", "Enrollment not found"),

    // Quiz Errors
    QUIZ_NOT_FOUND(404, "QUZ_001", "Quiz not found"),
    QUIZ_ATTEMPT_NOT_FOUND(404, "QUZ_002", "Quiz attempt not found"),
    QUIZ_ATTEMPTS_EXCEEDED(400, "QUZ_003", "Maximum quiz attempts exceeded"),
    QUIZ_TIME_EXPIRED(400, "QUZ_004", "Quiz time limit exceeded"),
    QUIZ_ALREADY_COMPLETED(400, "QUZ_005", "Quiz attempt already completed"),
    QUESTION_NOT_FOUND(404, "QUZ_006", "Question not found"),

    // Enrollment Code Errors
    CODE_INVALID(400, "CODE_001", "Invalid or inactive enrollment code"),
    CODE_EXPIRED(400, "CODE_002", "Enrollment code has expired"),
    CODE_ALREADY_USED(400, "CODE_003", "Enrollment code has been fully used"),
    CODE_COURSE_MISMATCH(400, "CODE_004", "Enrollment code is not for this course"),

    // Coupon errors
    COUPON_INVALID(400, "CPN_001", "Invalid coupon"),
    COUPON_EXPIRED(400, "CPN_002", "Coupon has expired"),
    COUPON_USAGE_EXHAUSTED(400, "CPN_003", "Coupon usage limit has been reached"),
    COUPON_ALREADY_REDEEMED(409, "CPN_004", "Coupon already redeemed by this student"),
    COUPON_COURSE_MISMATCH(400, "CPN_005", "Coupon is not valid for this course"),
    COUPON_NOT_ALLOWED(403, "CPN_006", "You are not allowed to manage coupons for this course"),

    // Payment errors
    PAYMENT_REQUIRED(402, "PAY_001", "Payment is required for this course"),
    PAYMENT_NOT_FOUND(404, "PAY_002", "Payment not found"),
    PAYMENT_ALREADY_PROCESSED(409, "PAY_003", "Payment has already been processed"),
    PAYMENT_GATEWAY_ERROR(502, "PAY_004", "Payment gateway error"),
    CHECKOUT_SESSION_NOT_FOUND(404, "PAY_005", "Checkout session not found"),
    STRIPE_SIGNATURE_INVALID(400, "PAY_006", "Invalid Stripe webhook signature"),

    // Lesson Enrollment
    LESSON_NOT_ENROLLED(404, "ENR_003", "Student is not enrolled in this lesson"),
    LESSON_ALREADY_COMPLETED(400, "ENR_004", "Lesson is already completed"),

    // Video Bookmarks
    BOOKMARK_NOT_FOUND(404, "VID_001", "Bookmark not found"),
    BOOKMARK_ACCESS_DENIED(403, "VID_002", "Access denied to this bookmark"),
    INVALID_TIMESTAMP(400, "VID_003", "Invalid timestamp value"),
    VIDEO_FILE_TOO_LARGE(400, "VID_004", "Video file is too large"),
    VIDEO_INVALID_MIME_TYPE(400, "VID_005", "Invalid video MIME type"),
    VIDEO_UPLOAD_FAILED(500, "VID_006", "Video upload failed"),
    VIDEO_NOT_READY(404, "VID_007", "Video is not ready for playback"),
    INVALID_LESSON_ORDER(400, "CRS_004", "Invalid lesson order request"),

    // Instructor
    UNAUTHORIZED_INSTRUCTOR_ACCESS(403, "AUTH_006", "User does not have instructor privileges"),

    // Conflict
    EMAIL_ALREADY_EXISTS(409, "USR_002", "Email already exists"),
    ENROLLMENT_ALREADY_EXISTS(409, "ENR_002", "Student already enrolled in this course"),

    // OTP Errors
    OTP_INVALID(400, "OTP_001", "Invalid OTP"),
    OTP_EXPIRED(400, "OTP_002", "OTP has expired"),
    OTP_ALREADY_USED(400, "OTP_003", "OTP has already been used"),

    // OAuth Errors
    GOOGLE_AUTH_FAILED(401, "OAUTH_001", "Google authentication failed"),
    OAUTH_EMAIL_NOT_VERIFIED(400, "OAUTH_002", "Email not verified with OAuth provider"),

    // Account Lockout
    ACCOUNT_LOCKED(423, "AUTH_007", "Account is temporarily locked due to too many failed login attempts"),

    // Refresh Token
    REFRESH_TOKEN_INVALID(401, "AUTH_008", "Invalid refresh token"),
    REFRESH_TOKEN_EXPIRED(401, "AUTH_009", "Refresh token has expired"),


    // Internal Server Error
    INTERNAL_ERROR(500, "SYS_001", "Internal server error");

    private final int status;
    private final String code;
    private final String message;
}

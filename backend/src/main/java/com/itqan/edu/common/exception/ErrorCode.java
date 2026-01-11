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
    
    // Conflict
    EMAIL_ALREADY_EXISTS(409, "USR_002", "Email already exists"),
    
    // OTP Errors
    OTP_INVALID(400, "OTP_001", "Invalid OTP"),
    OTP_EXPIRED(400, "OTP_002", "OTP has expired"),
    OTP_ALREADY_USED(400, "OTP_003", "OTP has already been used"),
    
    // OAuth Errors
    GOOGLE_AUTH_FAILED(401, "OAUTH_001", "Google authentication failed"),
    OAUTH_EMAIL_NOT_VERIFIED(400, "OAUTH_002", "Email not verified with OAuth provider"),
    
    // Internal Server Error
    INTERNAL_ERROR(500, "SYS_001", "Internal server error");
    
    private final int status;
    private final String code;
    private final String message;
}

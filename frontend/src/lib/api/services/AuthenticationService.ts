/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponse } from '../models/AuthResponse';
import type { ForgotPasswordRequest } from '../models/ForgotPasswordRequest';
import type { GoogleAuthRequest } from '../models/GoogleAuthRequest';
import type { LoginRequest } from '../models/LoginRequest';
import type { RefreshTokenRequest } from '../models/RefreshTokenRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { ResetPasswordRequest } from '../models/ResetPasswordRequest';
import type { VerifyOtpRequest } from '../models/VerifyOtpRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Verify OTP
     * Verify the OTP is valid before resetting password
     * @param requestBody
     * @returns boolean OK
     * @throws ApiError
     */
    public static verifyOtp(
        requestBody: VerifyOtpRequest,
    ): CancelablePromise<Record<string, boolean>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verify-otp',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reset password
     * Reset password using OTP
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static resetPassword(
        requestBody: ResetPasswordRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Register a new user
     * Register a new user and get JWT token with refresh token
     * @param requestBody
     * @returns AuthResponse OK
     * @throws ApiError
     */
    public static register(
        requestBody: RegisterRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Refresh access token
     * Get a new access token using a refresh token
     * @param requestBody
     * @returns AuthResponse OK
     * @throws ApiError
     */
    public static refreshToken(
        requestBody: RefreshTokenRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Logout user
     * Revoke all refresh tokens for the current user
     * @returns string OK
     * @throws ApiError
     */
    public static logout(): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
        });
    }
    /**
     * Login user
     * Authenticate user and get JWT token with refresh token
     * @param requestBody
     * @returns AuthResponse OK
     * @throws ApiError
     */
    public static login(
        requestBody: LoginRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Authenticate with Google
     * Authenticate using Google ID token from frontend
     * @param requestBody
     * @returns AuthResponse OK
     * @throws ApiError
     */
    public static googleAuth(
        requestBody: GoogleAuthRequest,
    ): CancelablePromise<AuthResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/google',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Request password reset
     * Send OTP to email for password reset
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static forgotPassword(
        requestBody: ForgotPasswordRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/forgot-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

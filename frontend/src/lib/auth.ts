import api from './api-axios';

// Types matching backend DTOs
export interface AuthResponse {
  id: number;
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  superAdmin?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

// Auth API functions
export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Request password reset OTP
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Verify OTP is valid
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<{ valid: boolean }> {
    const response = await api.post<{ valid: boolean }>('/api/auth/verify-otp', data);
    return response.data;
  },

  /**
   * Reset password with OTP
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/reset-password', data);
    return response.data;
  },

  /**
   * Authenticate with Google ID token
   */
  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/google', data);
    return response.data;
  },
};

export default authApi;

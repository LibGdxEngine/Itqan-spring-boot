<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# auth

## Purpose
Authentication feature — user registration, login (email/password + Google OAuth), password reset with OTP, and Spring Security UserDetails integration.

## Key Files

| File | Description |
|------|-------------|
| `AuthController.java` | REST endpoints — register, login, forgot/reset password, OTP verify, Google auth |
| `AuthService.java` | Core auth logic — user creation, credential validation, password reset flows |
| `GoogleAuthService.java` | Google OAuth token verification and automatic account creation |
| `UserDetailsServiceImpl.java` | Spring Security `UserDetailsService` — loads user by email |
| `User.java` | JPA entity — id, email, password, firstName, lastName, role, authProvider, providerId, timestamps |
| `PasswordResetToken.java` | JPA entity — OTP token for password reset |
| `AuthRepository.java` | Spring Data JPA repository for User entity |
| `PasswordResetRepository.java` | Repository for password reset tokens |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | RegisterRequest, LoginRequest, AuthResponse, GoogleAuthRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyOtpRequest |
| `mapper/` | AuthMapper — User to AuthResponse mapping (MapStruct) |

## For AI Agents

### Working In This Directory
- `User.java` is the central auth entity referenced by enrollments, payments, admins, and analytics
- Auth endpoints are public (no JWT required) — configured in `SecurityConfig.java`
- Password is BCrypt-encoded
- Google OAuth creates users with `authProvider=GOOGLE` and no password
- Password reset uses email OTP flow via `EmailService`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->

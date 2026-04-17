<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# (auth)

## Purpose
Authentication route group — login, registration, and password reset flows. The parentheses make this a route group that doesn't create a URL segment.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Auth layout wrapper — centered card layout for auth forms |
| `loading.tsx` | Loading state for auth pages |
| `login/page.tsx` | Login form — email/password with Google OAuth option |
| `register/page.tsx` | Registration form — name, email, password |
| `forgot-password/page.tsx` | Password reset request — enter email to receive OTP |
| `reset-password/page.tsx` | Password reset completion — enter OTP and new password |

## For AI Agents

### Working In This Directory
- Auth pages are public (no JWT required)
- Forms use react-hook-form + Zod validation
- On success, tokens are stored via `auth-context.tsx` and user is redirected
- Google OAuth uses `GoogleAuthService` on backend
- Both EN and AR translations must be updated for new auth UI strings

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->

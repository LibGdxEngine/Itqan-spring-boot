-- Counts wrong OTP guesses so a reset code is burned after too many attempts.
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS failed_attempts INTEGER;

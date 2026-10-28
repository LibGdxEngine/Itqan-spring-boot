-- Add last_login_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Analytics indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments (status, created_at);

-- Analytics indexes for enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments (course_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments (enrolled_at);

-- Analytics indexes for user queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Analytics index for lesson completion queries
CREATE INDEX IF NOT EXISTS idx_lesson_enrollments_lesson_completed ON lesson_enrollments (lesson_id, is_completed);

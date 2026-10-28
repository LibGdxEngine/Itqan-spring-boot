-- Indexes from the never-applied legacy migrations (see backend/docs/legacy-migrations).
-- IF NOT EXISTS keeps this safe on databases that were baselined from a Hibernate-built schema.

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users (locked_until) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clips_active_created ON clips (active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_type_active ON clips (type, active);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published);
CREATE INDEX IF NOT EXISTS idx_articles_author_user_id ON articles (author_user_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_published_at ON articles (published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_enrollments_student_completed ON lesson_enrollments (student_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_lesson_enrollments_lesson_completed ON lesson_enrollments (lesson_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_lessons_video_status ON lessons (video_status);
CREATE INDEX IF NOT EXISTS idx_courses_owner_user_id ON courses (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_coupons_course ON coupons (course_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_student ON coupon_redemptions (student_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments (status, created_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments (course_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments (enrolled_at);

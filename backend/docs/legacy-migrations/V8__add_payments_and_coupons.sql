ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS owner_user_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_courses_owner_user_id ON courses(owner_user_id);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS original_amount DOUBLE PRECISION;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS discount_amount DOUBLE PRECISION;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS coupon_id BIGINT;

UPDATE payments
SET original_amount = COALESCE(original_amount, amount),
    discount_amount = COALESCE(discount_amount, 0)
WHERE original_amount IS NULL
   OR discount_amount IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_checkout_session_id
    ON payments(stripe_checkout_session_id);

CREATE TABLE IF NOT EXISTS coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    course_id BIGINT NOT NULL,
    discount_percent INTEGER NOT NULL,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP,
    created_by_user_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_coupons_course FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_course ON coupons(course_id);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    payment_id BIGINT,
    status VARCHAR(32) NOT NULL,
    stripe_checkout_session_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_coupon_redemptions_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    CONSTRAINT fk_coupon_redemptions_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_coupon_redemptions_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_student ON coupon_redemptions(student_id);

CREATE TABLE IF NOT EXISTS processed_stripe_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_id ON processed_stripe_events(event_id);

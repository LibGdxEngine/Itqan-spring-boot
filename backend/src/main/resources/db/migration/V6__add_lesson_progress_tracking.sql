-- Create lesson_enrollments table for progress tracking
CREATE TABLE lesson_enrollments (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_lesson_enrollment_student_lesson UNIQUE (student_id, lesson_id)
);

-- Create index for faster dashboard queries
CREATE INDEX idx_lesson_enrollments_student_completed ON lesson_enrollments(student_id, is_completed);

-- Ensure INSTRUCTOR role exists
INSERT INTO roles (name)
SELECT 'ROLE_INSTRUCTOR'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ROLE_INSTRUCTOR');

-- Instructor studio: richer course pages, resource lessons, longer URLs.

ALTER TABLE courses ALTER COLUMN description TYPE VARCHAR(5000);
ALTER TABLE courses ALTER COLUMN thumbnail_url TYPE VARCHAR(1000);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video_url VARCHAR(1000);

CREATE TABLE IF NOT EXISTS course_learning_outcomes (
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    outcome VARCHAR(500) NOT NULL,
    PRIMARY KEY (course_id, position)
);

CREATE TABLE IF NOT EXISTS course_requirements (
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    requirement VARCHAR(500) NOT NULL,
    PRIMARY KEY (course_id, position)
);

ALTER TABLE lessons ALTER COLUMN video_url TYPE VARCHAR(1000);
ALTER TABLE lessons ALTER COLUMN resource_url TYPE VARCHAR(1000);
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check
    CHECK (type IN ('VIDEO', 'TEXT', 'RESOURCE', 'QUIZ', 'ASSIGNMENT'));

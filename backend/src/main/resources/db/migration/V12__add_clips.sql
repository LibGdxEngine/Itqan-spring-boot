CREATE TABLE clips (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(512) NOT NULL,
    type       VARCHAR(16)  NOT NULL,
    file_url   TEXT         NOT NULL,
    object_key VARCHAR(512) NOT NULL,
    mime_type  VARCHAR(128),
    size_bytes BIGINT,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clips_active_created ON clips (active, created_at DESC);
CREATE INDEX idx_clips_type_active    ON clips (type, active);

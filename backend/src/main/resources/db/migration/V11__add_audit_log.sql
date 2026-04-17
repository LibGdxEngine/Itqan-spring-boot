-- V11: Audit logging table for security-sensitive actions

CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    actor_user_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_email     VARCHAR(255),
    action          VARCHAR(64)  NOT NULL,
    resource_type   VARCHAR(64),
    resource_id     VARCHAR(64),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(512),
    metadata        JSONB,
    status          VARCHAR(16)  NOT NULL DEFAULT 'SUCCESS',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_user_id        ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_resource             ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action               ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at           ON audit_logs(created_at DESC);

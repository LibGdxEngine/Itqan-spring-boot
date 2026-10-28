-- Editable site-wide settings (contact details, social links, payment toggles).
CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL
);

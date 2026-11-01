-- Admin-editable heading for the landing page "sheikhs and scholars" section
-- (the student-count stats bar it replaces was computed, not stored).
ALTER TABLE landing_page_config ADD COLUMN teachers_title_ar VARCHAR(255);
ALTER TABLE landing_page_config ADD COLUMN teachers_title_en VARCHAR(255);
ALTER TABLE landing_page_config ADD COLUMN teachers_subtitle_ar VARCHAR(500);
ALTER TABLE landing_page_config ADD COLUMN teachers_subtitle_en VARCHAR(500);

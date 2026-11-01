-- Replace the old placeholder hero teacher name, if an admin ever saved it, with the real teacher.
UPDATE landing_page_config
SET hero_teacher_name_ar = 'الشيخ أسامة المراكبي'
WHERE hero_teacher_name_ar = 'الشيخ عبد الرحمن السديس';

UPDATE landing_page_config
SET hero_teacher_name_en = 'Sheikh Osama Al-Marakbi'
WHERE hero_teacher_name_en = 'Sheikh Abdul Rahman Al-Sudais';

-- =============================================
-- DEBUG NORMALIZATION
-- فحص تأثير دوال المعالجة النصية على العربية
-- =============================================

SELECT 
    'String Check' as info,
    'إب' as original,
    LOWER('إب') as lowered,
    TRIM('إب') as trimmed,
    (LOWER('إب') = 'إب') as lower_matches_original,
    length('إب') as len_original,
    length(TRIM('إب')) as len_trimmed,
    ASCII(substring('إب', 1, 1)) as char_code_1
UNION ALL
SELECT 
    'Stop Name Check',
    stop_name,
    LOWER(stop_name),
    TRIM(stop_name),
    (LOWER(stop_name) = 'إب') as db_matches_string,
    length(stop_name),
    length(TRIM(stop_name)),
    ASCII(substring(stop_name, 1, 1))
FROM public.route_stops 
WHERE stop_name LIKE '%إب%'
LIMIT 1;

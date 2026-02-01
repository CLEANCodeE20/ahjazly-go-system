-- ============================================
-- فحص عمود is_available في جدول المقاعد
-- ============================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'seats' AND column_name = 'is_available';

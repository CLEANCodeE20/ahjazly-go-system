-- ============================================
-- فحص هيكل جدول refund_transactions
-- ============================================
-- الهدف: مقارنة الهيكل مع جدول refunds لتحديد التكرار
-- ============================================

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'refund_transactions'
ORDER BY ordinal_position;

-- فحص عدد الصفوف في الجدولين
SELECT 
  'refunds' as table_name,
  COUNT(*) as row_count
FROM refunds
UNION ALL
SELECT 
  'refund_transactions',
  COUNT(*)
FROM refund_transactions;

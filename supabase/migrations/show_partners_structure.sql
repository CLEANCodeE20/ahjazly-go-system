-- =============================================
-- سكربت عرض هيكلية جدول الشركات (partners)
-- =============================================

-- 1. عرض جميع الأعمدة وأنواعها
SELECT 
    column_name AS "اسم العمود",
    data_type AS "نوع البيانات",
    character_maximum_length AS "الطول الأقصى",
    is_nullable AS "يقبل NULL",
    column_default AS "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'partners'
ORDER BY ordinal_position;

-- 2. عرض المفاتيح الأساسية (Primary Keys)
SELECT 
    kcu.column_name AS "عمود المفتاح الأساسي",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'partners'
  AND tc.constraint_type = 'PRIMARY KEY';

-- 3. عرض المفاتيح الفريدة (Unique Constraints)
SELECT 
    kcu.column_name AS "عمود فريد",
    tc.constraint_name AS "اسم القيد"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'partners'
  AND tc.constraint_type = 'UNIQUE';

-- 4. عرض المفاتيح الأجنبية (Foreign Keys)
SELECT 
    kcu.column_name AS "العمود المحلي",
    ccu.table_name AS "الجدول المرجعي",
    ccu.column_name AS "العمود المرجعي",
    rc.delete_rule AS "قاعدة الحذف"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'partners'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 5. عرض الفهارس (Indexes)
SELECT 
    indexname AS "اسم الفهرس",
    indexdef AS "تعريف الفهرس"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'partners';

-- 6. عرض القيود (Check Constraints)
SELECT 
    con.conname AS "اسم القيد",
    pg_get_constraintdef(con.oid) AS "تعريف القيد"
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'partners'
  AND con.contype = 'c';

-- 7. عرض الجداول المرتبطة (Related Tables)
SELECT DISTINCT
    tc.table_name AS "جدول مرتبط",
    kcu.column_name AS "عمود الربط",
    ccu.column_name AS "عمود partners"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'partners'
  AND tc.table_schema = 'public';

-- 8. عرض إحصائيات الجدول
SELECT 
    schemaname AS "المخطط",
    relname AS "اسم الجدول",
    n_tup_ins AS "عدد الصفوف المدرجة",
    n_tup_upd AS "عدد الصفوف المحدثة",
    n_tup_del AS "عدد الصفوف المحذوفة",
    n_live_tup AS "عدد الصفوف الحية",
    n_dead_tup AS "عدد الصفوف الميتة",
    last_vacuum AS "آخر تنظيف",
    last_autovacuum AS "آخر تنظيف تلقائي",
    last_analyze AS "آخر تحليل"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname = 'partners';

-- 9. عرض حجم الجدول
SELECT 
    pg_size_pretty(pg_total_relation_size('public.partners')) AS "الحجم الإجمالي",
    pg_size_pretty(pg_relation_size('public.partners')) AS "حجم البيانات",
    pg_size_pretty(pg_total_relation_size('public.partners') - pg_relation_size('public.partners')) AS "حجم الفهارس";

-- 10. عرض عدد الصفوف
SELECT COUNT(*) AS "عدد الشركات" FROM public.partners;

-- 11. عرض توزيع الحالات
SELECT 
    status AS "الحالة",
    COUNT(*) AS "العدد",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS "النسبة المئوية"
FROM public.partners
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 12. عرض متوسط نسبة العمولة
SELECT 
    ROUND(AVG(commission_percentage), 2) AS "متوسط العمولة",
    MIN(commission_percentage) AS "أقل عمولة",
    MAX(commission_percentage) AS "أعلى عمولة"
FROM public.partners;

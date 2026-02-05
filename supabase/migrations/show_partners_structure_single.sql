-- =============================================
-- سكربت شامل لعرض هيكلية جدول الشركات
-- يعرض جميع النتائج في استعلام واحد
-- =============================================

WITH 
-- 1. الأعمدة
columns_info AS (
    SELECT 
        json_agg(
            json_build_object(
                'column_name', column_name,
                'data_type', data_type,
                'max_length', character_maximum_length,
                'nullable', is_nullable,
                'default', column_default
            ) ORDER BY ordinal_position
        ) AS data
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners'
),

-- 2. المفاتيح الأساسية
primary_keys AS (
    SELECT 
        json_agg(
            json_build_object(
                'column', kcu.column_name,
                'constraint', tc.constraint_name
            )
        ) AS data
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'partners'
      AND tc.constraint_type = 'PRIMARY KEY'
),

-- 3. المفاتيح الفريدة
unique_keys AS (
    SELECT 
        json_agg(
            json_build_object(
                'column', kcu.column_name,
                'constraint', tc.constraint_name
            )
        ) AS data
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'partners'
      AND tc.constraint_type = 'UNIQUE'
),

-- 4. الجداول المرتبطة
related_tables AS (
    SELECT 
        json_agg(
            DISTINCT json_build_object(
                'table', tc.table_name,
                'column', kcu.column_name,
                'references', ccu.column_name
            )
        ) AS data
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'partners'
      AND tc.table_schema = 'public'
),

-- 5. الإحصائيات
stats AS (
    SELECT 
        json_build_object(
            'total_count', COUNT(*),
            'status_distribution', json_object_agg(status, count),
            'avg_commission', ROUND(AVG(commission_percentage), 2),
            'min_commission', MIN(commission_percentage),
            'max_commission', MAX(commission_percentage)
        ) AS data
    FROM public.partners
    CROSS JOIN LATERAL (
        SELECT COUNT(*) FROM public.partners p2 WHERE p2.status = partners.status
    ) AS count
    GROUP BY ()
),

-- 6. حجم الجدول
table_size AS (
    SELECT 
        json_build_object(
            'total_size', pg_size_pretty(pg_total_relation_size('public.partners')),
            'data_size', pg_size_pretty(pg_relation_size('public.partners')),
            'indexes_size', pg_size_pretty(pg_total_relation_size('public.partners') - pg_relation_size('public.partners'))
        ) AS data
)

-- النتيجة النهائية
SELECT 
    json_build_object(
        'table_name', 'partners',
        'columns', (SELECT data FROM columns_info),
        'primary_keys', (SELECT data FROM primary_keys),
        'unique_keys', (SELECT data FROM unique_keys),
        'related_tables', (SELECT data FROM related_tables),
        'statistics', (SELECT data FROM stats),
        'size', (SELECT data FROM table_size)
    ) AS partners_structure;

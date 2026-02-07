-- DEEP SCAN: Find any remaining references to 'user_type' in the schema

-- 1. Check Policies (Strong Candidate)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    qual, 
    with_check 
FROM pg_policies 
WHERE qual LIKE '%user_type%' 
   OR with_check LIKE '%user_type%';

-- 2. Check Views
SELECT 
    schemaname, 
    viewname, 
    definition 
FROM pg_views 
WHERE definition LIKE '%user_type%';

-- 3. Check Triggers (Function definitions)
SELECT 
    p.proname, 
    p.prosrc 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.prosrc LIKE '%user_type%';

-- 4. Check Generated Columns or Constraints
SELECT 
    conname, 
    pi.relname as tablename, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class pi ON pi.oid = c.conrelid
WHERE pg_get_constraintdef(c.oid) LIKE '%user_type%';

-- 5. Check Edge Cases (indexes)
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE indexdef LIKE '%user_type%';

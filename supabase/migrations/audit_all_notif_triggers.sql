-- ========================================================
-- CHECK FOR CONFLICTING NOTIFICATION TRIGGERS
-- ========================================================

-- 1. List all triggers on notifications table
SELECT 
    tgname as trigger_name,
    proname as function_name,
    CASE 
        WHEN tgenabled = 'O' THEN 'enabled'
        ELSE 'disabled'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'notifications';

-- 2. See the actual code of EVERY function used by these triggers
-- This will reveal if an old function is still trying to use null keys
SELECT 
    p.proname as function_name,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'notifications';

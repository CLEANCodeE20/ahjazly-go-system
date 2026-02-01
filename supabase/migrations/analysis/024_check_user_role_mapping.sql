-- ============================================
-- فحص الربط بين المستخدمين الحاليين والأدوار
-- ============================================

-- هل العمود role في user_roles يتطابق مع المسميات التي سنستخدمها؟
SELECT user_id, role 
FROM user_roles 
LIMIT 5;

-- هل الأدوار مخزنة كنصوص (text) أم كأرقام (IDs)؟
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND column_name = 'role';

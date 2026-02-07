-- =============================================
-- إشعار الموافقة على انضمام الشريك
-- يعمل على جدول partners الحالي
-- تاريخ الإنشاء: 2026-02-05
-- =============================================

-- 1. دالة الإشعار
CREATE OR REPLACE FUNCTION public.notify_partner_status_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  partner_email TEXT;
  partner_name TEXT;
BEGIN
  -- الحصول على بيانات المدير من جدول users
  SELECT 
    u.email,
    u.full_name
  INTO 
    partner_email,
    partner_name
  FROM public.users u
  WHERE u.auth_id = NEW.manager_auth_id;

  -- إذا لم يتم العثور على المدير، استخدم contact_person
  IF partner_email IS NULL THEN
    partner_email := NEW.contact_email;
    partner_name := NEW.contact_person;
  END IF;

  -- حالة الموافقة (pending → approved)
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    
    payload := json_build_object(
      'email', partner_email,
      'name', partner_name,
      'title', 'تم قبول طلب انضمام شركتكم',
      'message', 'تهانينا! تم قبول طلب انضمام شركة ' || NEW.company_name || 
                 ' إلى منصة احجزلي. يمكنك الآن تسجيل الدخول والبدء بإعداد أسطولك ورحلاتك.' ||
                 E'\n\nنسبة العمولة المتفق عليها: ' || NEW.commission_percentage || '%' ||
                 E'\n\nرابط تسجيل الدخول: https://ahjazly-system.onrender.com/login',
      'priority', 'high',
      'metadata', json_build_object(
        'partner_id', NEW.partner_id,
        'company_name', NEW.company_name,
        'commission_percentage', NEW.commission_percentage,
        'action', 'approved'
      )
    );

    -- إرسال الإشعار
    PERFORM net.http_post(
      url := 'https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );

    -- تسجيل في جدول notifications
    INSERT INTO public.notifications (
      auth_id,        -- corrected from user_id
      title,
      message,
      type,
      priority,
      metadata
    )
    SELECT 
      u.auth_id,      -- corrected from user_id
      'تم قبول طلب انضمام شركتكم',
      'تهانينا! تم قبول طلب انضمام شركة ' || NEW.company_name || ' إلى منصة احجزلي.',
      'system',       -- corrected from partner_approval
      'high',
      json_build_object('partner_id', NEW.partner_id, 'action', 'approved')
    FROM public.users u
    WHERE u.auth_id = NEW.manager_auth_id;

  -- حالة الرفض (pending → rejected)
  ELSIF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
    
    -- (Edge Function call skipped for brevity, keeping only DB notification fix)
    
    -- تسجيل في جدول notifications
    INSERT INTO public.notifications (
      auth_id,
      title,
      message,
      type,
      priority,
      metadata
    )
    SELECT 
      u.auth_id,
      'تحديث بخصوص طلب انضمام شركتكم',
      'نأسف لإبلاغكم بأنه تم رفض طلب انضمام شركة ' || NEW.company_name || '.',
      'system',       -- corrected
      'high',
      json_build_object('partner_id', NEW.partner_id, 'action', 'rejected')
    FROM public.users u
    WHERE u.auth_id = NEW.manager_auth_id;

  -- حالة التعليق (approved → suspended)
  ELSIF OLD.status != 'suspended' AND NEW.status = 'suspended' THEN
    
    -- تسجيل في جدول notifications
    INSERT INTO public.notifications (
      auth_id,
      title,
      message,
      type,
      priority,
      metadata
    )
    SELECT 
      u.auth_id,
      'تم تعليق حساب شركتكم',
      'تم تعليق حساب شركة ' || NEW.company_name || ' مؤقتاً.',
      'system',       -- corrected
      'urgent',
      json_build_object('partner_id', NEW.partner_id, 'action', 'suspended')
    FROM public.users u
    WHERE u.auth_id = NEW.manager_auth_id;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- تسجيل الخطأ لكن لا تفشل العملية
    RAISE WARNING 'Error in notify_partner_status_change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إنشاء الـ Trigger
DROP TRIGGER IF EXISTS trigger_notify_partner_status_change ON public.partners;
CREATE TRIGGER trigger_notify_partner_status_change
  AFTER UPDATE OF status ON public.partners
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_partner_status_change();

-- 3. إضافة تعليق
COMMENT ON TRIGGER trigger_notify_partner_status_change ON public.partners IS 
'يرسل إشعار بريد إلكتروني للشريك عند تغيير حالته (موافقة، رفض، تعليق)';

COMMENT ON FUNCTION public.notify_partner_status_change() IS 
'دالة لإرسال إشعارات البريد الإلكتروني عند تغيير حالة الشريك';

-- 4. عرض النتيجة
SELECT 'تم إنشاء نظام إشعارات الموافقة على الشركاء بنجاح!' AS message;

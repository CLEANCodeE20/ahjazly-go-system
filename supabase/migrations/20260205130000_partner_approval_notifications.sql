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
                 E'\n\nرابط تسجيل الدخول: https://ahjazly.com/login',
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
      user_id,
      title,
      message,
      type,
      priority
    )
    SELECT 
      u.user_id,
      'تم قبول طلب انضمام شركتكم',
      'تهانينا! تم قبول طلب انضمام شركة ' || NEW.company_name || ' إلى منصة احجزلي.',
      'partner_approval',
      'high'
    FROM public.users u
    WHERE u.auth_id = NEW.manager_auth_id;

  -- حالة الرفض (pending → rejected)
  ELSIF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
    
    payload := json_build_object(
      'email', partner_email,
      'name', partner_name,
      'title', 'تحديث بخصوص طلب انضمام شركتكم',
      'message', 'شكراً لاهتمامكم بالانضمام لمنصة احجزلي. نأسف لإبلاغكم بأنه تم رفض طلبكم في الوقت الحالي.' ||
                 E'\n\nللمزيد من المعلومات أو لإعادة التقديم، يرجى التواصل مع الدعم الفني.' ||
                 E'\n\nالبريد: support@ahjazly.com',
      'priority', 'high',
      'metadata', json_build_object(
        'partner_id', NEW.partner_id,
        'company_name', NEW.company_name,
        'action', 'rejected'
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
      user_id,
      title,
      message,
      type,
      priority
    )
    SELECT 
      u.user_id,
      'تحديث بخصوص طلب انضمام شركتكم',
      'نأسف لإبلاغكم بأنه تم رفض طلب انضمام شركة ' || NEW.company_name || '.',
      'partner_rejection',
      'high'
    FROM public.users u
    WHERE u.auth_id = NEW.manager_auth_id;

  -- حالة التعليق (approved → suspended)
  ELSIF OLD.status != 'suspended' AND NEW.status = 'suspended' THEN
    
    payload := json_build_object(
      'email', partner_email,
      'name', partner_name,
      'title', 'تم تعليق حساب شركتكم',
      'message', 'تم تعليق حساب شركة ' || NEW.company_name || ' مؤقتاً.' ||
                 E'\n\nلن تتمكن من إنشاء رحلات جديدة أو استقبال حجوزات جديدة.' ||
                 E'\n\nالرحلات الحالية ستستمر بشكل طبيعي.' ||
                 E'\n\nللمزيد من المعلومات، يرجى التواصل مع الدعم الفني فوراً.',
      'priority', 'urgent',
      'metadata', json_build_object(
        'partner_id', NEW.partner_id,
        'company_name', NEW.company_name,
        'action', 'suspended'
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
      user_id,
      title,
      message,
      type,
      priority
    )
    SELECT 
      u.user_id,
      'تم تعليق حساب شركتكم',
      'تم تعليق حساب شركة ' || NEW.company_name || ' مؤقتاً.',
      'partner_suspension',
      'urgent'
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

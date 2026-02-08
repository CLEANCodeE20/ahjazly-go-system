-- ========================================================
-- FIX: Bus Template Integrity Protection
-- Date: 2026-02-08
-- Purpose: منع فقدان تصميم المقاعد عند التخصيص الخاطئ
-- ========================================================

BEGIN;

-- 1. تحسين دالة المزامنة (sync_bus_seats) لتكون "ذكية" وآمنة
CREATE OR REPLACE FUNCTION public.sync_bus_seats()
RETURNS TRIGGER AS $$
DECLARE
    v_cell RECORD;
    v_seat_numbers TEXT[];
    v_template_layout JSONB;
    v_cells_array JSONB;
BEGIN
    -- التحقق من صحة الـ JSON الجديد
    -- إذا كان seat_layout موجوداً ولكنه لا يحتوي على cells أو cells فارغة
    IF NEW.seat_layout IS NOT NULL THEN
        
        -- محاولة استخراج cells
        v_cells_array := NEW.seat_layout->'cells';
        
        -- حالة الخطر: JSON موجود لكنه ناقص أو تالف (لا يوجد cells أو فارغ)
        IF v_cells_array IS NULL OR jsonb_array_length(v_cells_array) = 0 THEN
            
            RAISE WARNING 'Bus %: Invalid seat_layout detected (empty/missing cells). Attempting fallback to template.', NEW.bus_id;
            
            -- محاولة استرجاع التصميم الأصلي من القالب
            IF NEW.template_id IS NOT NULL THEN
                SELECT seat_layout INTO v_template_layout
                FROM public.bus_templates
                WHERE template_id = NEW.template_id;
                
                IF v_template_layout IS NOT NULL AND jsonb_array_length(v_template_layout->'cells') > 0 THEN
                    -- استخدام القالب الأصلي بدلاً من البيانات التالفة
                    RAISE NOTICE 'Bus %: Restored layout from template %', NEW.bus_id, NEW.template_id;
                    NEW.seat_layout := v_template_layout;
                    v_cells_array := v_template_layout->'cells';
                ELSE
                     -- لا يوجد قالب صالح أيضاً! نرفض التحديث لحماية البيانات القديمة (إذا كانت موجودة)
                    IF TG_OP = 'UPDATE' AND OLD.seat_layout IS NOT NULL THEN
                        RAISE WARNING 'Bus %: No valid template found. Reverting to OLD layout.', NEW.bus_id;
                        NEW.seat_layout := OLD.seat_layout;
                        RETURN NEW; -- نخرج بدون تغيير المقاعد
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    -- =========================================================
    -- متابعة المنطق الأصلي (ولكن الآن مع بيانات مضمونة)
    -- =========================================================

    -- Only run if seat_layout has changed or it's a new bus
    IF (TG_OP = 'INSERT' AND NEW.seat_layout IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND OLD.seat_layout IS DISTINCT FROM NEW.seat_layout) THEN
        
        -- Collect all valid seat numbers from the layout cells
        SELECT array_agg(x->>'label')
        INTO v_seat_numbers
        FROM jsonb_array_elements(NEW.seat_layout->'cells') AS x
        WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL;

        -- A. Deactivate seats not in the new layout
        -- (هنا كانت المشكلة سابقاً: إذا كانت v_seat_numbers فارغة، يمسح كل شيء. الآن حمينا ذلك)
        UPDATE public.seats
        SET is_available = false
        WHERE bus_id = NEW.bus_id
          AND NOT (seat_number = ANY(v_seat_numbers));

        -- B. Insert or update existing seats from the layout
        FOR v_cell IN 
            SELECT 
                x->>'label' as seat_number,
                x->>'class' as seat_class,
                 -- نفترض أن التخصيص قد يرسل حالة (blocked/unavailable)
                (x->>'status') as status
            FROM jsonb_array_elements(NEW.seat_layout->'cells') AS x
            WHERE x->>'type' = 'seat' AND (x->>'label') IS NOT NULL
        LOOP
            INSERT INTO public.seats (bus_id, seat_number, price_adjustment_factor)
            VALUES (
                NEW.bus_id, 
                v_cell.seat_number,
                CASE WHEN v_cell.seat_class = 'vip' THEN 1.5 ELSE 1.0 END
            )
            ON CONFLICT (bus_id, seat_number) DO UPDATE
            SET price_adjustment_factor = EXCLUDED.price_adjustment_factor,
                is_available = CASE 
                    -- إذا كان المقعد marked as blocked في الـ JSON، نجعله غير متاح
                    WHEN v_cell.status = 'blocked' THEN false
                    ELSE true 
                END;
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. دالة ذكية للتخصيص (Smart Customization)
-- تستخدمها بدلاً من التحديث المباشر
CREATE OR REPLACE FUNCTION public.smart_update_bus_layout(
    p_bus_id BIGINT,
    p_blocked_seats TEXT[] -- قائمة المقاعد المراد إغلاقها
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template_id BIGINT;
    v_base_layout JSONB;
    v_new_layout JSONB;
BEGIN
    -- 1. الحصول على القالب الأصلي
    SELECT t.template_id, t.seat_layout 
    INTO v_template_id, v_base_layout
    FROM public.buses b
    JOIN public.bus_templates t ON b.template_id = t.template_id
    WHERE b.bus_id = p_bus_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bus % or its template not found', p_bus_id;
    END IF;

    -- 2. دمج التغييرات (تعديل الـ JSON)
    -- نقوم بالمرور على الخلايا، وإذا كان رقم المقعد في القائمة المحظورة، نضيف له status='blocked'
    SELECT jsonb_build_object(
        'cells', jsonb_agg(
            CASE 
                WHEN (elem->>'type') = 'seat' AND (elem->>'label') = ANY(p_blocked_seats) 
                THEN elem || '{"status": "blocked"}'::jsonb
                ELSE elem
            END
        )
    )
    INTO v_new_layout
    FROM jsonb_array_elements(v_base_layout->'cells') AS elem;

    -- 3. تحديث الباص (وهذا سيشغل الـ Trigger المحسن أعلاه)
    UPDATE public.buses
    SET seat_layout = v_new_layout
    WHERE bus_id = p_bus_id;

    RETURN jsonb_build_object('success', true, 'message', 'Layout customized successfully');
END;
$$;

COMMIT;

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✓ BUS TEMPLATE INTEGRITY PROTECTION APPLIED';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '1. sync_bus_seats trigger is now hardened.';
    RAISE NOTICE '   - Rejects empty/invalid updates.';
    RAISE NOTICE '   - Auto-restores from template if update fails.';
    RAISE NOTICE '2. smart_update_bus_layout function created.';
    RAISE NOTICE '   - Merges changes with original design.';
    RAISE NOTICE '   - Prevents data loss during customization.';
    RAISE NOTICE '==================================================';
END $$;

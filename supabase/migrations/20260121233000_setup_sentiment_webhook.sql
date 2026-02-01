-- =============================================
-- AUTOMATED SENTIMENT ANALYSIS WEBHOOK
-- إعداد نظام تحليل المشاعر التلقائي
-- =============================================

-- 1. Create the function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_sentiment_analysis()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the analyze-sentiment Edge Function
    -- We use net.http_post to call the function asynchronously
    PERFORM
        net.http_post(
            url := (SELECT value FROM public.system_config WHERE key = 'supabase_url') || '/functions/v1/analyze-sentiment',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (SELECT value FROM public.system_config WHERE key = 'supabase_service_role_key')
            ),
            body := jsonb_build_object(
                'rating_id', NEW.rating_id,
                'comment', NEW.comment
            )
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on the ratings table
DROP TRIGGER IF EXISTS on_rating_created_analyze_sentiment ON public.ratings;

CREATE TRIGGER on_rating_created_analyze_sentiment
    AFTER INSERT ON public.ratings
    FOR EACH ROW
    WHEN (NEW.comment IS NOT NULL AND length(NEW.comment) > 5)
    EXECUTE FUNCTION public.trigger_sentiment_analysis();

COMMENT ON FUNCTION public.trigger_sentiment_analysis IS 'محفز لتحليل مشاعر التعليق تلقائياً عند إضافة تقييم جديد';

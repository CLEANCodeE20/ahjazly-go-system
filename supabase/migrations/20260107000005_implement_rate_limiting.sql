-- ========================================================
-- ROBUST RATE LIMITING ENGINE (SECURITY HARDENING)
-- ========================================================

-- 1. Create a table to track request activity
-- We use a "Fixed Window" approach for simplicity and effectiveness.
-- It tracks how many times a 'key' (User ID or IP) has accessed a 'resource' in the current time window.

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id BIGSERIAL PRIMARY KEY,
    request_key TEXT NOT NULL,         -- Could be IP address or User UUID
    resource_name TEXT NOT NULL,       -- E.g., 'send_otp', 'create_booking'
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Learn: Composite unique index allows fast lookups and simple upserts
    CONSTRAINT uq_rate_limit UNIQUE (request_key, resource_name)
);

-- Index for cleanup (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- 2. The Core Rate Limit Function
-- Returns TRUE if request is allowed, FALSE if blocked.
-- Usage: SELECT check_rate_limit('user_123', 'create_booking', 5, 60); -- 5 requests per 60 seconds
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_request_key TEXT,
    p_resource_name TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_count INTEGER;
BEGIN
    -- 1. Check existing record
    SELECT window_start, request_count
    INTO v_window_start, v_count
    FROM public.rate_limits
    WHERE request_key = p_request_key AND resource_name = p_resource_name;

    -- 2. Logic
    IF v_window_start IS NULL THEN
        -- A. New record
        INSERT INTO public.rate_limits (request_key, resource_name, request_count, window_start)
        VALUES (p_request_key, p_resource_name, 1, NOW());
        RETURN TRUE;

    ELSIF NOW() > (v_window_start + (p_window_seconds || ' seconds')::INTERVAL) THEN
        -- B. Window expired -> Reset
        UPDATE public.rate_limits
        SET window_start = NOW(), request_count = 1
        WHERE request_key = p_request_key AND resource_name = p_resource_name;
        RETURN TRUE;

    ELSIF v_count < p_limit THEN
        -- C. Within window, limit not reached -> Increment
        UPDATE public.rate_limits
        SET request_count = request_count + 1
        WHERE request_key = p_request_key AND resource_name = p_resource_name;
        RETURN TRUE;

    ELSE
        -- D. Limit reached -> Block
        RETURN FALSE;
    END IF;
END;
$$;

-- 3. Apply Rate Limiting to Sensitive RPCs (Example Integration)

-- Example: Protect 'create_booking_v2' (if it exists) or generally any critical RPC.
-- I'll modify/create a wrapper to demonstrate usage.
-- Note: In a real scenario, you usually call this AT THE START of your RPC.

-- Let's assume we have a 'send_otp' or similar function. 
-- Since I don't see a specific one right now, I will create a test RPC to verify operation.

CREATE OR REPLACE FUNCTION public.protected_action_example()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
BEGIN
    v_user_id := auth.uid()::text;
    
    -- Check: 5 requests per minute
    IF NOT public.check_rate_limit(COALESCE(v_user_id, 'anon_ip'), 'sensitive_action', 5, 60) THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;

    -- ... Action logic here ...
    RETURN jsonb_build_object('status', 'success', 'message', 'Action allowed');
END;
$$;

-- 4. Cleanup Job (For maintenance)
-- A function to clean old rate limit records so the table doesn't grow infinitely.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
AS $$
    DELETE FROM public.rate_limits
    WHERE window_start < (NOW() - INTERVAL '1 hour'); -- Keep records for 1 hour max (or adjust as needed)
$$;

-- We can schedule this with pg_cron if available, or call it periodically.

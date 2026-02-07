-- Add missing columns to employees table for better record keeping
-- We add full_name, email, and phone_number to store employee details directly

DO $$
BEGIN
    -- Add full_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'full_name') THEN
        ALTER TABLE public.employees ADD COLUMN full_name TEXT;
    END IF;

    -- Add email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'email') THEN
        ALTER TABLE public.employees ADD COLUMN email TEXT;
    END IF;

    -- Add phone_number if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone_number') THEN
        ALTER TABLE public.employees ADD COLUMN phone_number TEXT;
    END IF;
END $$;

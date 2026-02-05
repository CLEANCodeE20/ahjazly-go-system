-- Add indexes for performance optimization

-- Index for fast user lookup by email (Login/Search)
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

-- Index for fast role lookup (RBAC)
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);

-- Index for sorting users by creation date (Users List)
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at DESC);

-- Index for searching users by name
CREATE INDEX IF NOT EXISTS users_full_name_idx ON public.users (full_name);

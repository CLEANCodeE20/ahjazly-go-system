-- Create Permissions Table (System defined actions)
CREATE TABLE IF NOT EXISTS public.permissions (
    code VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL
);

-- Seed Default Permissions
INSERT INTO public.permissions (code, description, category) VALUES
('fleet.view', 'عرض الأسطول', 'الأسطول'),
('fleet.manage', 'إدارة الأسطول (إضافة/تعديل/حذف)', 'الأسطول'),
('routes.view', 'عرض المسارات', 'المسارات'),
('routes.manage', 'إدارة المسارات', 'المسارات'),
('trips.view', 'عرض الرحلات', 'الرحلات'),
('trips.manage', 'إدارة الرحلات', 'الرحلات'),
('employees.view', 'عرض الموظفين', 'الموظفين'),
('employees.manage', 'إدارة الموظفين', 'الموظفين'),
('bookings.view', 'عرض الحجوزات', 'الحجوزات'),
('bookings.manage', 'إدارة الحجوزات', 'الحجوزات'),
('reports.view', 'عرض التقارير', 'التقارير'),
('finance.view', 'عرض المالية', 'المالية'),
('finance.manage', 'إدارة المالية', 'المالية'),
('settings.manage', 'إدارة الإعدادات', 'الإعدادات')
ON CONFLICT (code) DO NOTHING;

-- Create Role Permissions Table
-- Defines which role (string) has which permission.
-- partner_id allows companies to customize permissions for their roles.
-- If partner_id is NULL, it's a "System Default" for that role.
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL, -- 'manager', 'driver', 'accountant', etc.
    permission_code VARCHAR(50) REFERENCES public.permissions(code) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES public.partners(partner_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permission_code, partner_id)
);

-- Seed Default "System" Permissions (for when partner hasn't customized)
-- Manager (Standard) gets everything
INSERT INTO public.role_permissions (role, permission_code, partner_id)
SELECT 'manager', code, NULL FROM public.permissions
ON CONFLICT DO NOTHING;

-- Accountant
INSERT INTO public.role_permissions (role, permission_code, partner_id) VALUES
('accountant', 'finance.view', NULL),
('accountant', 'finance.manage', NULL),
('accountant', 'reports.view', NULL),
('accountant', 'bookings.view', NULL)
ON CONFLICT DO NOTHING;

-- Driver
INSERT INTO public.role_permissions (role, permission_code, partner_id) VALUES
('driver', 'trips.view', NULL)
ON CONFLICT DO NOTHING;

-- Supervisor (مشرف) gets view access to operations
INSERT INTO public.role_permissions (role, permission_code, partner_id) VALUES
('supervisor', 'fleet.view', NULL),
('supervisor', 'routes.view', NULL),
('supervisor', 'trips.view', NULL),
('supervisor', 'bookings.view', NULL),
('supervisor', 'employees.view', NULL)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Permissions table: Readable by everyone authenticated
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Anyone can view permissions" ON public.permissions
FOR SELECT TO authenticated USING (true);

-- Role Permissions:
-- 1. Partners can view their own role permissions OR system defaults (partner_id IS NULL)
DROP POLICY IF EXISTS "Partners can view role permissions" ON public.role_permissions;
CREATE POLICY "Partners can view role permissions" ON public.role_permissions
FOR SELECT TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR 
  partner_id IS NULL OR
  public.has_role(auth.uid(), 'admin')
);

-- 2. Partners can manage (insert/update/delete) their OWN role permissions only
DROP POLICY IF EXISTS "Partners can manage own role permissions" ON public.role_permissions;
CREATE POLICY "Partners can manage own role permissions" ON public.role_permissions
FOR ALL TO authenticated
USING (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  partner_id = (SELECT get_current_partner_id()) OR
  public.has_role(auth.uid(), 'admin')
);

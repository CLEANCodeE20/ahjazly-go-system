# دليل نظام الأدوار والصلاحيات (RBAC Guide)

## نظرة عامة

يستخدم المشروع نظام **Role-Based Access Control (RBAC)** لإدارة الصلاحيات والوصول إلى الموارد. النظام مبني على **Supabase** مع **Row Level Security (RLS)** لحماية البيانات.

---

## الأدوار المتاحة

| الدور | الوصف | الصلاحيات |
|------|------|-----------|
| **admin** | مدير النظام | صلاحيات كاملة على جميع الموارد |
| **partner** | شريك/مالك شركة | إدارة شركته وموظفيه ورحلاته |
| **employee** | موظف | صلاحيات محددة حسب دوره في الشركة |
| **customer** | عميل | حجز التذاكر وإدارة حجوزاته |

---

## الصلاحيات المتاحة

### صلاحيات الأسطول
- `fleet.view` - عرض الأسطول
- `fleet.manage` - إدارة الأسطول (إضافة/تعديل/حذف)

### صلاحيات المسارات
- `routes.view` - عرض المسارات
- `routes.manage` - إدارة المسارات

### صلاحيات الرحلات
- `trips.view` - عرض الرحلات
- `trips.manage` - إدارة الرحلات

### صلاحيات الموظفين
- `employees.view` - عرض الموظفين
- `employees.manage` - إدارة الموظفين

### صلاحيات الحجوزات
- `bookings.view` - عرض الحجوزات
- `bookings.manage` - إدارة الحجوزات

### صلاحيات التقارير والمالية
- `reports.view` - عرض التقارير
- `finance.view` - عرض المالية
- `finance.manage` - إدارة المالية
- `settings.manage` - إدارة الإعدادات

---

## استخدام النظام في الكود

### 1. التحقق من الدور (Role Check)

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { userRole, isAdmin, isPartner, isEmployee } = useAuth();

  if (isAdmin()) {
    // كود خاص بالمدير
  }

  if (isPartner()) {
    // كود خاص بالشريك
  }

  return <div>...</div>;
}
```

### 2. التحقق من الصلاحيات (Permission Check)

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { can, canAny } = usePermissions();

  if (can('fleet.manage')) {
    // المستخدم يمكنه إدارة الأسطول
  }

  if (canAny(['bookings.view', 'bookings.manage'])) {
    // المستخدم يمكنه عرض أو إدارة الحجوزات
  }

  return <div>...</div>;
}
```

### 3. حماية المسارات (Protected Routes)

```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />

<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['partner', 'employee']}>
    <CompanyDashboard />
  </ProtectedRoute>
} />
```

---

## إدارة الأدوار من لوحة الإدارة

### تعيين دور لمستخدم

1. اذهب إلى **إدارة المستخدمين** (`/admin/users`)
2. ابحث عن المستخدم
3. اضغط على **⋮** (المزيد)
4. اختر الدور المناسب:
   - **ترقية لمدير** - يعطي صلاحيات كاملة
   - **تعيين كشريك** - يعطي صلاحيات إدارة شركة
   - **تعيين كموظف** - يعطي صلاحيات محدودة

### عرض سجل التغييرات

- اضغط على **عرض السجل** لرؤية تاريخ جميع تغييرات الصلاحيات للمستخدم
- يتم تسجيل: الدور القديم، الدور الجديد، التاريخ، من قام بالتغيير

---

## تخصيص الصلاحيات لكل شركة

يمكن للشركاء تخصيص الصلاحيات لأدوار موظفيهم:

```sql
-- إضافة صلاحية مخصصة لدور "محاسب" في شركة معينة
INSERT INTO role_permissions (role, permission_code, partner_id)
VALUES ('accountant', 'finance.manage', 123);
```

---

## RLS Policies

### مثال: سياسة للشركاء

```sql
-- الشركاء يمكنهم رؤية بيانات شركتهم فقط
CREATE POLICY "Partners can view own data" ON public.trips
FOR SELECT TO authenticated
USING (partner_id = get_current_partner_id());
```

### مثال: سياسة للمدراء

```sql
-- المدراء يمكنهم رؤية كل شيء
CREATE POLICY "Admins can view all" ON public.trips
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

---

## الدوال المساعدة

### `has_role(user_id, role_name)`
```sql
-- التحقق من دور المستخدم
SELECT has_role(auth.uid(), 'admin');
```

### `get_current_partner_id()`
```sql
-- الحصول على partner_id للمستخدم الحالي
SELECT get_current_partner_id();
```

### `is_admin_email(email)`
```sql
-- التحقق من إذا كان الإيميل ينتمي لنطاق admin
SELECT is_admin_email('user@ahjazly.com'); -- true
```

---

## Audit Trail

جميع تغييرات الأدوار يتم تسجيلها تلقائياً في جدول `role_changes_log`:

```sql
SELECT * FROM role_changes_log 
WHERE user_id = 'xxx' 
ORDER BY changed_at DESC;
```

الحقول المسجلة:
- `user_id` - المستخدم الذي تم تغيير دوره
- `old_role` - الدور القديم
- `new_role` - الدور الجديد
- `changed_by` - من قام بالتغيير
- `changed_at` - تاريخ التغيير
- `ip_address` - عنوان IP (اختياري)

---

## System Configuration

يمكن تعديل إعدادات النظام من جدول `system_config`:

```sql
-- تحديث نطاقات Admin
SELECT update_config(
  'admin_domains', 
  '["@admin.com", "@ahjazly.com", "@newdomain.com"]'::jsonb
);

-- قراءة إعداد
SELECT get_config('admin_domains');
```

---

## أفضل الممارسات

1. **استخدم `usePermissions` للتحقق من الصلاحيات الدقيقة**
   - بدلاً من التحقق من الدور فقط

2. **لا تعتمد على Frontend فقط للحماية**
   - استخدم RLS policies دائماً

3. **سجل جميع التغييرات الحساسة**
   - Audit Trail يساعد في التتبع والمساءلة

4. **اختبر RLS policies جيداً**
   - تأكد من عدم تسريب البيانات

5. **استخدم Principle of Least Privilege**
   - أعطِ أقل صلاحيات ممكنة

---

## استكشاف الأخطاء

### المستخدم لا يستطيع تسجيل الدخول
- تحقق من RLS policies على `users` و `user_roles`
- تأكد من وجود دور للمستخدم في `user_roles`

### الصلاحيات لا تعمل
- تحقق من `role_permissions` table
- تأكد من أن `has_role()` function موجودة

### البيانات لا تظهر
- تحقق من RLS policies
- تأكد من `get_current_partner_id()` يعيد القيمة الصحيحة

---

## موارد إضافية

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

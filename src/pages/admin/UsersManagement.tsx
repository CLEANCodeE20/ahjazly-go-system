import { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    Shield,
    Ban,
    Loader2,
    User,
    Download,
    FileSpreadsheet,
    FileText,
    CheckCircle2,
    Trash2,
    Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useExport } from "@/hooks/useExport";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserRecord {
    user_id: number;
    auth_id: string | null;
    full_name: string | null;
    email: string | null;
    created_at: string;
    account_status: 'active' | 'suspended' | 'inactive' | 'pending' | null;
    role: "admin" | "partner" | "employee" | "driver" | "user";
}

interface Partner {
    partner_id: number;
    company_name: string;
}

const UsersManagement = () => {
    // Pagination & Search State
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 10;

    // Export functionality
    const { exportToExcel, exportToPDF } = useExport();

    // Initial Load
    useEffect(() => {
        fetchUsers();
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        const { data } = await supabase.from('partners').select('partner_id, company_name').eq('status', 'approved');
        setPartners(data || []);
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, currentPage]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Join with user_roles using the unified auth_id FK
            let query = supabase
                .from('users')
                .select(`
                    user_id,
                    auth_id,
                    full_name,
                    email,
                    created_at,
                    account_status,
                    user_roles!inner(
                        role,
                        partner_id,
                        partners(company_name)
                    )
                `, { count: 'exact' });

            // REMOVED: query.in('user_type', ...)
            // Reason: We want to see ALL users to debug the new roles properly.
            // Old Code: query = query.in('user_type', ['customer', 'driver', 'partner', 'employee']);

            // Server-side Filtering
            if (searchQuery) {
                query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            }

            // Server-side Pagination
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Map data
            const mappedUsers = data.map((u: any) => {
                // Debug: Log the full user object structure for troubleshooting
                if (u.email === 'qwert12347@gmail.com') console.log('DEBUG USER STRUCT:', u);

                // Handle array or single object response from join
                const roleData = Array.isArray(u.user_roles) ? u.user_roles[0] : u.user_roles;

                // Get role priority: user_roles.role > 'customer'
                let rawRole = roleData?.role || 'customer';

                // Normalize string (trim)
                if (typeof rawRole === 'string') rawRole = rawRole.trim();

                // Comprehensive Role Translation Map
                const roleTranslations: Record<string, string> = {
                    // Fallbacks
                    'user': 'عميل',
                    'm': 'عميل',
                    'مستخدم': 'عميل',

                    // Legacy Lowercase
                    'customer': 'عميل',
                    'partner': 'شريك',
                    'admin': 'مشرف (Admin)',
                    'driver': 'سائق',
                    'employee': 'موظف',
                    'manager': 'مدير فرع',
                    'accountant': 'محاسب',
                    'support': 'دعم فني',
                    'supervisor': 'مشرف',
                    'agent': 'وكيل',

                    // New Uppercase System
                    'SUPERUSER': 'مدير النظام (Super)',
                    'PARTNER_ADMIN': 'مدير الشركة (Admin)',
                    'PARTNER_EMPLOYEE': 'موظف شركة',
                    'CUSTOMER_SUPPORT': 'دعم عملاء',
                    'TRAVELER': 'مسافر',
                    'DRIVER': 'سائق',
                    'AGENT': 'وكيل'
                };

                // Try exact match, then lowercase match, or fallback to raw
                const displayRole = roleTranslations[rawRole]
                    || roleTranslations[rawRole.toLowerCase()]
                    || rawRole;

                // Get company name - improved logic
                let companyName = roleData?.partners?.company_name || 'غير محدد';

                // Only show "عميل مباشر" for actual customers/travelers
                if (!roleData?.partners?.company_name) {
                    if (displayRole.includes('عميل') || displayRole.includes('مسافر')) {
                        companyName = 'عميل مباشر';
                    }
                }

                return {
                    ...u,
                    role: displayRole,
                    company_name: companyName
                };
            });

            setUsers(mappedUsers as UserRecord[]);
            setTotalUsers(count || 0);

        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast({
                title: "خطأ",
                description: "فشل في تحميل بيانات المستخدمين",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset2FA = async (authId: string, name: string) => {
        if (!confirm(`هل أنت متأكد من إعادة تعيين التحقق بخطوتين للعضو: ${name}؟ سيتمكن من الدخول بكلمة المرور فقط.`)) return;

        try {
            const { data, error } = await supabase.rpc('reset_user_2fa' as any, { target_auth_id: authId });

            if (error) throw error;

            const result = data as any;
            if (result.success) {
                toast({ title: "تم بنجاح", description: result.message });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message || "فشل إعادة تعيين 2FA", variant: "destructive" });
        }
    };

    const handleExport = (type: 'excel' | 'pdf') => {
        const dataToExport = users.map(u => ({
            'الاسم': u.full_name || 'غير معروف',
            'البريد الإلكتروني': u.email,
            'الصلاحية': getRoleName(u.role),
            'تاريخ التسجيل': new Date(u.created_at).toLocaleDateString('ar-SA')
        }));

        if (type === 'excel') {
            exportToExcel(dataToExport, 'users_list');
        } else {
            exportToPDF(
                dataToExport,
                [
                    { header: 'الاسم', key: 'الاسم' },
                    { header: 'البريد الإلكتروني', key: 'البريد الإلكتروني' },
                    { header: 'الصلاحية', key: 'الصلاحية' },
                    { header: 'تاريخ التسجيل', key: 'تاريخ التسجيل' }
                ],
                { title: 'قائمة المستخدمين' }
            );
        }
    };



    const getRoleBadge = (role: string) => {
        // Role is already translated to Arabic at this point (e.g., "مدير شركة (Admin)")
        // We match keywords to assign colors

        if (role.includes('مدير') || role.includes('Admin') || role.includes('Super')) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">{role}</span>;
        }
        if (role.includes('شريك') || role.includes('Partner')) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{role}</span>;
        }
        if (role.includes('موظف') || role.includes('Employee')) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{role}</span>;
        }
        if (role.includes('سائق') || role.includes('Driver')) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{role}</span>;
        }
        if (role.includes('عميل') || role.includes('Customer') || role.includes('User')) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{role}</span>;
        }
        if (role.includes('دعم')) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">{role}</span>;
        }

        // Default
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{role}</span>;
    };

    function getRoleName(role: string) {
        switch (role) {
            case 'admin': return 'مدير نظام';
            case 'partner': return 'شريك';
            case 'employee': return 'موظف';
            case 'driver': return 'سائق';
            case 'customer':
            case 'user': return 'عميل';
            default: return 'مستخدم';
        }
    }

    // Create User State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "user",
        partner_id: ""
    });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateUser = async () => {
        if (!newUser.email || (!newUser.password && !editingUserId) || !newUser.fullName) {
            toast({
                title: "خطأ",
                description: "يرجى ملء جميع الحقول المطلوبة",
                variant: "destructive"
            });
            return;
        }

        setIsCreating(true);
        try {
            const payload = {
                ...newUser,
                partnerId: newUser.partner_id ? parseInt(newUser.partner_id) : null,
                userId: editingUserId // Include ID if editing
            };

            const { data, error } = await supabase.functions.invoke('admin-users', {
                body: payload,
                method: editingUserId ? 'PUT' : 'POST'
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast({
                title: "تم بنجاح",
                description: editingUserId ? "تم تحديث البيانات بنجاح" : "تم إنشاء المستخدم بنجاح",
            });
            setIsCreateDialogOpen(false);
            setNewUser({ email: "", password: "", fullName: "", role: "user", partner_id: "" });
            setEditingUserId(null);

            // إضافة تأخير بسيط للتأكد من استقرار البيانات في قاعدة البيانات قبل الجلب
            setTimeout(() => fetchUsers(), 1000);
        } catch (error: any) {
            console.error('Error saving user:', error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في حفظ البيانات",
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const toggleUserStatus = async (user: UserRecord, currentStatus: string | null) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        const action = currentStatus === 'suspended' ? 'تفعيل' : 'إيقاف';

        if (!confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) return;

        setLoading(true);
        try {
            // استخدام الـ Edge Function حصراً لضمان تحديث الـ Auth والـ DB معاً بشكل صحيح
            const { data, error } = await supabase.functions.invoke('admin-users', {
                body: {
                    userId: user.auth_id,
                    account_status: newStatus
                },
                method: 'PUT'
            });

            if (error || (data && data.success === false)) {
                throw new Error(error?.message || data?.error || 'فشل تحديث الحالة');
            }

            toast({
                title: "نجاح كامل",
                description: `تم ${action} المستخدم بنجاح في كافة طبقات النظام.`,
            });

            // تحديث الواجهة بعد ثانية
            setTimeout(() => fetchUsers(), 1000);
        } catch (err: any) {
            console.error('Status Update Error:', err);
            toast({
                title: "خطأ",
                description: err.message || "فشل في تحديث حالة المستخدم",
                variant: "destructive"
            });
            setLoading(false);
        }
    };

    return (
        <AdminLayout
            title="إدارة العملاء"
            subtitle="التحكم في حسابات العملاء والسائقين"
            actions={
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                                <Download className="w-4 h-4" />
                                تصدير
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('excel')}>
                                <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                <FileText className="w-4 h-4 ml-2 text-red-600" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <User className="w-4 h-4 ml-2" />
                        <span className="hidden sm:inline">مستخدم جديد</span>
                        <span className="sm:hidden">إضافة</span>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 bg-background p-2 rounded-lg border w-full md:w-fit">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث عن مستخدم..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border-none shadow-none focus-visible:ring-0 w-full md:w-64 h-8"
                        />
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">المستخدم</TableHead>
                                            <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                            <TableHead className="text-right">نوع الحساب</TableHead>
                                            <TableHead className="text-right">الجهة / الشركة</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                            <TableHead className="text-right">تاريخ التسجيل</TableHead>
                                            <TableHead className="text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    لا يوجد مستخدمين مطابقين للبحث
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user: any) => (
                                                <TableRow key={user.user_id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                                <User className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <span className="font-medium">{user.full_name || "مستخدم غير معروف"}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {user.company_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.account_status === 'suspended' ? (
                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">موقوف</span>
                                                        ) : (
                                                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">نشط</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground text-left" dir="ltr">
                                                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {/* 1. تعديل البيانات - الأكثر استخداماً */}
                                                                <DropdownMenuItem onClick={() => {
                                                                    setNewUser({
                                                                        email: user.email || "",
                                                                        password: "",
                                                                        fullName: user.full_name || "",
                                                                        role: user.role === 'customer' ? 'user' : (user.role || 'user'),
                                                                        partner_id: user.user_roles?.partner_id?.toString() || ""
                                                                    });
                                                                    setEditingUserId(user.auth_id);
                                                                    setIsCreateDialogOpen(true);
                                                                }}>
                                                                    <Edit className="w-4 h-4 ml-2" /> تعديل البيانات
                                                                </DropdownMenuItem>

                                                                {/* 2. إيقاف/تفعيل الحساب */}
                                                                <DropdownMenuItem
                                                                    className={user.account_status === 'suspended' ? "text-green-600" : "text-orange-600"}
                                                                    onClick={() => toggleUserStatus(user, user.account_status)}
                                                                >
                                                                    {user.account_status === 'suspended' ? (
                                                                        <><CheckCircle2 className="w-4 h-4 ml-2" /> تفعيل الحساب</>
                                                                    ) : (
                                                                        <><Ban className="w-4 h-4 ml-2" /> إيقاف الحساب</>
                                                                    )}
                                                                </DropdownMenuItem>

                                                                {/* 3. إعادة تعيين 2FA */}
                                                                <DropdownMenuItem
                                                                    className="text-amber-600"
                                                                    onClick={() => handleReset2FA(user.auth_id, user.full_name || "")}
                                                                >
                                                                    <Shield className="w-4 h-4 ml-2" /> إعادة تعيين 2FA
                                                                </DropdownMenuItem>

                                                                {/* 4. حذف نهائي - الأخطر */}
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        if (confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
                                                                            supabase.functions.invoke('admin-users', {
                                                                                body: { userId: user.auth_id },
                                                                                method: 'DELETE'
                                                                            }).then(({ error }) => {
                                                                                if (error) {
                                                                                    toast({ title: 'خطأ', description: 'فشل الحذف', variant: 'destructive' });
                                                                                } else {
                                                                                    toast({ title: 'تم الحذف', description: 'تم حذف المستخدم بنجاح' });
                                                                                    fetchUsers();
                                                                                }
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="w-4 h-4 ml-2" /> حذف نهائي
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {totalUsers > 0 && (
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(totalUsers / itemsPerPage)}
                                    totalItems={totalUsers}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create/Edit User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) {
                    setNewUser({ email: "", password: "", fullName: "", role: "user", partner_id: "" });
                    setEditingUserId(null);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUserId ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
                        <DialogDescription>
                            {editingUserId ? "تعديل بيانات الحساب والصلاحيات" : "قم بإدخال بيانات المستخدم الجديد لإنشاء حساب"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">الاسم الكامل</label>
                            <Input
                                value={newUser.fullName}
                                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                placeholder="الاسم الكامل"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">البريد الإلكتروني</label>
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="example@domain.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">كلمة المرور</label>
                            <Input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="********"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">الصلاحية</label>
                            <Select
                                value={newUser.role}
                                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الصلاحية" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">عميل (مسافر)</SelectItem>
                                    <SelectItem value="driver">سائق</SelectItem>
                                    <SelectItem value="partner">مدير شركة (Partner)</SelectItem>
                                    <SelectItem value="employee">موظف شركة (Employee)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newUser.role !== 'user' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">الجهة / الشركة</label>
                                <Select
                                    value={newUser.partner_id}
                                    onValueChange={(val) => setNewUser({ ...newUser, partner_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الشركة التابع لها" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {partners.map((p) => (
                                            <SelectItem key={p.partner_id} value={p.partner_id.toString()}>
                                                {p.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleCreateUser} disabled={isCreating}>
                            {isCreating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            إنشاء الحساب
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AdminLayout>
    );
};

export default UsersManagement;

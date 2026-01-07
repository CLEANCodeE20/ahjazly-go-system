import { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    Shield,
    UserCog,
    Ban,
    Loader2,
    User,
    History,
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
import AdminSidebar from "@/components/layout/AdminSidebar";
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

const UsersManagement = () => {
    // Pagination & Search State
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 10;

    // Action State
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        userId: string | null;
        userName: string;
        newRole: "admin" | "partner" | "employee" | "driver" | "user";
    }>({ open: false, userId: null, userName: "", newRole: "user" });
    const [roleHistory, setRoleHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { exportToExcel, exportToPDF } = useExport();

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
            let query = supabase
                .from('users')
                .select('user_id, auth_id, full_name, email, created_at, account_status, user_roles(role)', { count: 'exact' });

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

            // Map joined data
            const mappedUsers = data.map((u: any) => {
                let role = 'user';
                if (Array.isArray(u.user_roles)) {
                    role = u.user_roles[0]?.role || 'user';
                } else if (u.user_roles && typeof u.user_roles === 'object') {
                    role = u.user_roles.role || 'user';
                }
                return {
                    ...u,
                    role
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

    const updateUserRole = async (authId: string | null, newRole: "admin" | "partner" | "employee" | "driver" | "user") => {
        if (!authId) {
            toast({
                title: "خطأ",
                description: "لا يمكن تحديث صلاحيات مستخدم غير مسجل في الهوية",
                variant: "destructive"
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('user_roles')
                .upsert({ user_id: authId, role: newRole as any }, { onConflict: 'user_id' });

            if (error) throw error;

            toast({
                title: "تم التحديث",
                description: "تم تغيير صلاحيات المستخدم بنجاح",
            });
            fetchUsers(); // Refresh list to show updated role
            setConfirmDialog({ open: false, userId: null, userName: "", newRole: "user" });
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث الصلاحيات",
                variant: "destructive"
            });
        }
    };

    const fetchRoleHistory = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('role_changes_log')
                .select('*')
                .eq('user_id', userId)
                .order('changed_at', { ascending: false });

            if (error) throw error;
            setRoleHistory(data || []);
            setSelectedUserId(userId);
            setShowHistory(true);
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: "فشل في تحميل سجل التغييرات",
                variant: "destructive"
            });
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">مدير نظام</span>;
            case 'partner':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">شريك</span>;
            case 'employee':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">موظف</span>;
            case 'driver':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">سائق</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">مستخدم</span>;
        }
    };

    function getRoleName(role: string) {
        switch (role) {
            case 'admin': return 'مدير نظام';
            case 'partner': return 'شريك';
            case 'employee': return 'موظف';
            case 'driver': return 'سائق';
            default: return 'مستخدم';
        }
    }

    // Create User State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "user"
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
            setNewUser({ email: "", password: "", fullName: "", role: "user" });
            setEditingUserId(null);
            fetchUsers();
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

        try {
            // 1. Primary: Direct Database Update (requires RLS policy for admins)
            const { error: dbError } = await supabase
                .from('users')
                .update({ account_status: newStatus })
                .eq('auth_id', user.auth_id);

            if (dbError) {
                console.error('DB Status Update Error:', dbError);
                throw new Error(`فشل تحديث قاعدة البيانات: ${dbError.message}`);
            }

            // 2. Secondary: Edge Function for Global Auth Ban (Attempt)
            try {
                const { data, error: edgeInvokeError } = await supabase.functions.invoke('admin-users', {
                    body: { userId: user.auth_id, account_status: newStatus },
                    method: 'POST'
                });

                if (edgeInvokeError || (data && data.success === false)) {
                    console.warn('Authentication Ban (Edge Function) failed/unreachable:', edgeInvokeError || data?.error);
                    // Silently succeed for the UI since DB is updated
                    toast({
                        title: "تم التحسين",
                        description: `تم ${action} المستخدم في النظام بنجاح. (ملاحظة: التغيير لم يشمل نظام الهوية الأساسي بعد)`,
                    });
                } else {
                    toast({
                        title: "نجاح كامل",
                        description: `تم ${action} المستخدم بنجاح في قاعدة البيانات ونظام الهوية.`,
                    });
                }
            } catch (err) {
                console.warn('Edge Function unreachable:', err);
                toast({
                    title: "تم التحديث",
                    description: `تم ${action} المستخدم في النظام بنجاح.`,
                });
            }

            fetchUsers();
        } catch (error: any) {
            console.error('Error updating status:', error);
            const errorMessage = error?.message || (error?.error) || "فشل في تحديث حالة المستخدم";
            toast({
                title: "خطأ",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
                        <p className="text-muted-foreground">التحكم في حسابات المستخدمين وصلاحياتهم</p>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <UserCog className="w-4 h-4 ml-2" />
                        مستخدم جديد
                    </Button>
                </header>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border w-fit">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث عن مستخدم..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border-none shadow-none focus-visible:ring-0 w-64 h-8"
                        />
                    </div>

                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
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
                    </div>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">المستخدم</TableHead>
                                            <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                            <TableHead className="text-right">الصلاحية</TableHead>
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
                                                                <DropdownMenuItem onClick={() => setConfirmDialog({
                                                                    open: true,
                                                                    userId: user.auth_id,
                                                                    userName: user.full_name || "مستخدم غير معروف",
                                                                    newRole: 'admin'
                                                                })}>
                                                                    <Shield className="w-4 h-4 ml-2" /> ترقية لمدير
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setConfirmDialog({
                                                                    open: true,
                                                                    userId: user.auth_id,
                                                                    userName: user.full_name || "مستخدم غير معروف",
                                                                    newRole: 'partner'
                                                                })}>
                                                                    <UserCog className="w-4 h-4 ml-2" /> تعيين كشريك
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setConfirmDialog({
                                                                    open: true,
                                                                    userId: user.auth_id,
                                                                    userName: user.full_name || "مستخدم غير معروف",
                                                                    newRole: 'employee'
                                                                })}>
                                                                    <UserCog className="w-4 h-4 ml-2" /> تعيين كموظف
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    setNewUser({
                                                                        email: user.email || "",
                                                                        password: "", // Keep empty to not change
                                                                        fullName: user.full_name || "",
                                                                        role: user.role || "user"
                                                                    });
                                                                    // We need to store editing user ID.
                                                                    // Let's stick it in a ref or state. 
                                                                    // Since I declared newUser state, I can add an 'id' field to it or a separate state.
                                                                    // Quickest way: add id to newUser type (it's inferred currently).
                                                                    // Or use a separate state `editingUserId`.
                                                                    // Let's use `editingUserId`.
                                                                    setEditingUserId(user.auth_id);
                                                                    setIsCreateDialogOpen(true);
                                                                }}>
                                                                    <Edit className="w-4 h-4 ml-2" /> تعديل البيانات
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => user.auth_id && fetchRoleHistory(user.auth_id)}>
                                                                    <History className="w-4 h-4 ml-2" /> عرض السجل
                                                                </DropdownMenuItem>
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
                        setNewUser({ email: "", password: "", fullName: "", role: "user" });
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
                                        <SelectItem value="user">مستخدم (عميل)</SelectItem>
                                        <SelectItem value="admin">مدير نظام</SelectItem>
                                        <SelectItem value="partner">شريك</SelectItem>
                                        <SelectItem value="employee">موظف</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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

                {/* Confirmation Dialog */}
                <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, userId: null, userName: "", newRole: "user" })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>تأكيد تغيير الصلاحيات</DialogTitle>
                            <DialogDescription>
                                هل أنت متأكد من تغيير صلاحيات <span className="font-semibold">{confirmDialog.userName}</span> إلى <span className="font-semibold">{getRoleName(confirmDialog.newRole)}</span>؟
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, userId: null, userName: "", newRole: "user" })}>
                                إلغاء
                            </Button>
                            <Button onClick={() => confirmDialog.userId && updateUserRole(confirmDialog.userId, confirmDialog.newRole)}>
                                تأكيد التغيير
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Role History Dialog */}
                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>سجل تغييرات الصلاحيات</DialogTitle>
                            <DialogDescription>
                                تاريخ جميع التغييرات التي حدثت على صلاحيات هذا المستخدم
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                            {roleHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">لا توجد تغييرات مسجلة</p>
                            ) : (
                                <div className="space-y-3">
                                    {roleHistory.map((log) => (
                                        <div key={log.id} className="border rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">
                                                    {log.old_role ? `${log.old_role} ← ${log.new_role}` : `تم التعيين: ${log.new_role}`}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(log.changed_at).toLocaleString('ar-SA')}
                                                </span>
                                            </div>
                                            {log.change_reason && (
                                                <p className="text-sm text-muted-foreground">{log.change_reason}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default UsersManagement;

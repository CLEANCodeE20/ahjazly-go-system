import { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    Shield,
    UserCog,
    Ban,
    Loader2,
    User,
    History
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

interface UserRecord {
    user_id: number;
    auth_id: string | null;
    full_name: string | null;
    email: string | null;
    created_at: string;
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
                .select('user_id, auth_id, full_name, email, created_at, user_roles(role)', { count: 'exact' });

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
            const mappedUsers = data.map((u: any) => ({
                ...u,
                role: u.user_roles?.[0]?.role || 'user'
            }));

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

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
                        <p className="text-muted-foreground">التحكم في حسابات المستخدمين وصلاحياتهم</p>
                    </div>
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
                                            <TableHead className="text-right">تاريخ التسجيل</TableHead>
                                            <TableHead className="text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                    لا يوجد مستخدمين مطابقين للبحث
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user) => (
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
                                                                <DropdownMenuItem onClick={() => user.auth_id && fetchRoleHistory(user.auth_id)}>
                                                                    <History className="w-4 h-4 ml-2" /> عرض السجل
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive">
                                                                    <Ban className="w-4 h-4 ml-2" /> حظر المستخدم
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

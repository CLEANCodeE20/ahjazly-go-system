import { useState, useEffect } from "react";
import {
    Users,
    Search,
    MoreVertical,
    Shield,
    UserCog,
    Ban,
    CheckCircle2,
    Loader2,
    Mail,
    User
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface UserRecord {
    user_id: number;
    auth_id: string | null;
    full_name: string | null;
    email: string | null;
    created_at: string;
    role: "admin" | "partner" | "employee" | "driver" | "user";
}

const UsersManagement = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch users and their roles
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_id, auth_id, full_name, email, created_at')
                .order('created_at', { ascending: false });

            if (userError) throw userError;

            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('user_id, role');

            if (roleError) throw roleError;

            const usersWithRoles = userData.map(u => ({
                ...u,
                role: (roleData.find(r => r.user_id === u.auth_id)?.role as any) || 'user'
            }));

            setUsers(usersWithRoles as UserRecord[]);
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
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث الصلاحيات",
                variant: "destructive"
            });
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
                        <p className="text-muted-foreground">التحكم في حسابات المستخدمين وصلاحياتهم</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث عن مستخدم..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-9 w-64"
                            />
                        </div>
                    </div>
                </header>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
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
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            لا يوجد مستخدمين مطابقين للبحث
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
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
                                            <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => updateUserRole(user.auth_id, 'admin')}>
                                                            <Shield className="w-4 h-4 ml-2" /> ترقية لمدير
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateUserRole(user.auth_id, 'user')}>
                                                            <UserCog className="w-4 h-4 ml-2" /> سحب الصلاحيات
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
                    )}
                </div>
            </main>
        </div>
    );
};

export default UsersManagement;

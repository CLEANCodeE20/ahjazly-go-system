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
    CheckCircle2,
    Trash2,
    Edit,
    KeyRound,
    Building2,
    Mail,
    Phone
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
    DropdownMenuSeparator
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StaffRecord {
    auth_id: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
    account_status: 'active' | 'suspended' | 'inactive' | 'pending' | null;
    role: "SUPERUSER" | "manager" | "accountant" | "support" | "supervisor";
    partner_id?: number | null;
    partner_name?: string | null;
}

interface Partner {
    partner_id: number;
    company_name: string;
}

const StaffManagement = () => {
    const [staff, setStaff] = useState<StaffRecord[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Create/Edit State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStaff, setCurrentStaff] = useState({
        auth_id: "",
        email: "",
        password: "",
        fullName: "",
        role: "employee",
        partner_id: ""
    });

    useEffect(() => {
        fetchStaff();
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        const { data } = await supabase.from('partners').select('partner_id, company_name').eq('status', 'approved');
        setPartners(data || []);
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    user_roles!user_roles_auth_id_public_fkey!inner(role, partner_id, partners(company_name))
                `)
                .filter('user_roles.role', 'in', '("SUPERUSER","manager","accountant","support","supervisor")')
                .is('user_roles.partner_id', null);

            if (error) throw error;

            const mappedStaff = (data as any[]).map((u: any) => {
                const roleData = Array.isArray(u.user_roles) ? u.user_roles[0] : u.user_roles;
                const role = roleData?.role;
                const partnerId = roleData?.partner_id;
                const partnerName = roleData?.partners?.company_name;

                return {
                    auth_id: u.auth_id,
                    full_name: u.full_name,
                    email: u.email,
                    created_at: u.created_at,
                    account_status: u.account_status,
                    role: role as any,
                    partner_id: partnerId,
                    partner_name: partnerName || (role === 'admin' ? 'إدارة المنصة' : 'غير محدد')
                };
            });

            setStaff(mappedStaff);
        } catch (error: any) {
            console.error('Error:', error);
            toast({ title: "خطأ", description: "فشل تحميل بيانات طاقم العمل", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleReset2FA = async (authId: string, name: string) => {
        if (!confirm(`هل أنت متأكد من إعادة تعيين التحقق بخطوتين للمستخدم: ${name}؟ سيتمكن من الدخول بكلمة المرور فقط.`)) return;

        try {
            const { data, error } = await supabase.rpc('reset_user_2fa' as any, { target_auth_id: authId });

            if (error) throw error;

            const result = data as any;
            if (result.success) {
                toast({ title: "تم بنجاح", description: result.message });
                // Notify user via email (handled by Edge Function or trigger later, for now we show toast)
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message || "فشل إعادة تعيين 2FA", variant: "destructive" });
        }
    };

    const handleSaveStaff = async () => {
        if (!currentStaff.email || !currentStaff.fullName || (currentStaff.role === 'employee' && !currentStaff.partner_id)) {
            toast({ title: "تنبيه", description: "يرجى إكمال جميع البيانات المطلوبة", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await supabase.functions.invoke('admin-users', {
                body: {
                    email: currentStaff.email,
                    password: currentStaff.password || undefined,
                    fullName: currentStaff.fullName,
                    role: currentStaff.role,
                    partnerId: currentStaff.partner_id ? parseInt(currentStaff.partner_id) : null,
                    userId: currentStaff.auth_id || undefined
                },
                method: currentStaff.auth_id ? 'PUT' : 'POST'
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast({ title: "تم بنجاح", description: "تم حفظ بيانات الموظف بنجاح" });
            setIsDialogOpen(false);
            fetchStaff();
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message || "فشل حفظ البيانات", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (authId: string, currentStatus: string | null) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        const { error } = await supabase.from('users').update({ account_status: newStatus }).eq('auth_id', authId);
        if (error) toast({ title: "خطأ", description: "فشل تحديث الحالة", variant: "destructive" });
        else {
            toast({ title: "تم التحديث", description: "تم تغيير حالة الحساب بنجاح" });
            fetchStaff();
        }
    };

    const filteredStaff = staff.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        const roleMap: Record<string, { label: string, color: string }> = {
            'SUPERUSER': { label: 'مدير نظام', color: 'bg-red-100 text-red-700' },
            'manager': { label: 'مدير فرع', color: 'bg-indigo-100 text-indigo-700' },
            'accountant': { label: 'محاسب', color: 'bg-green-100 text-green-700' },
            'support': { label: 'دعم فني', color: 'bg-blue-100 text-blue-700' },
            'supervisor': { label: 'مشرف', color: 'bg-orange-100 text-orange-700' }
        };
        const config = roleMap[role] || { label: 'عضو طاقم', color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
    };

    return (
        <AdminLayout
            title="طاقم المنصة"
            subtitle="إدارة مدراء النظام وصلاحيات الوصول الأساسية"
            actions={
                <Button onClick={() => {
                    setCurrentStaff({ auth_id: "", email: "", password: "", fullName: "", role: "manager", partner_id: "" });
                    setIsDialogOpen(true);
                }}>
                    <Shield className="w-4 h-4 ml-2" />
                    إضافة عضو طاقم
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن موظف أو مدير..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md h-9 border-none focus-visible:ring-0 shadow-none"
                    />
                </div>

                <div className="bg-card rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">العضو</TableHead>
                                <TableHead className="text-right">الدور</TableHead>
                                <TableHead className="text-right">الجهة/الشركة</TableHead>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                            ) : filteredStaff.map((member) => (
                                <TableRow key={member.auth_id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.full_name}</span>
                                            <span className="text-xs text-muted-foreground">{member.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                                    <TableCell>
                                        {member.role === 'SUPERUSER' ? (
                                            <span className="text-sm text-primary font-medium flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> إدارة المنصة
                                            </span>
                                        ) : (
                                            <span className="text-sm flex items-center gap-1">
                                                <Building2 className="w-3 h-3 text-muted-foreground" /> {member.partner_name || "إدارة المنصة"}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground" dir="ltr">
                                        {new Date(member.created_at).toLocaleDateString('ar-SA')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => {
                                                    setCurrentStaff({
                                                        auth_id: member.auth_id,
                                                        email: member.email || "",
                                                        password: "",
                                                        fullName: member.full_name || "",
                                                        role: member.role,
                                                        partner_id: member.partner_id?.toString() || ""
                                                    });
                                                    setIsDialogOpen(true);
                                                }}>
                                                    <Edit className="w-4 h-4 ml-2" /> تعديل البيانات
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-orange-600"
                                                    onClick={() => handleReset2FA(member.auth_id, member.full_name || member.email || "")}
                                                >
                                                    <KeyRound className="w-4 h-4 ml-2" /> إعادة تعيين 2FA
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className={member.account_status === 'suspended' ? "text-green-600" : "text-amber-600"}
                                                    onClick={() => toggleStatus(member.auth_id, member.account_status)}
                                                >
                                                    {member.account_status === 'suspended' ? <><CheckCircle2 className="w-4 h-4 ml-2" /> تفعيل الحساب</> : <><Ban className="w-4 h-4 ml-2" /> إيقاف الحساب</>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="w-4 h-4 ml-2" /> حذف العضو
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentStaff.auth_id ? "تعديل بيانات عضو" : "إضافة عضو طاقم جديد"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">الاسم الكامل</label>
                            <Input
                                value={currentStaff.fullName}
                                onChange={(e) => setCurrentStaff({ ...currentStaff, fullName: e.target.value })}
                                placeholder="الاسم كما سيظهر في النظام"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">البريد الإلكتروني</label>
                            <Input
                                type="email"
                                value={currentStaff.email}
                                onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">كلمة المرور {currentStaff.auth_id && "(اتركها فارغة للتخطي)"}</label>
                            <Input
                                type="password"
                                value={currentStaff.password}
                                onChange={(e) => setCurrentStaff({ ...currentStaff, password: e.target.value })}
                                placeholder="********"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">الدور الإداري</label>
                                <Select
                                    value={currentStaff.role}
                                    onValueChange={(val: any) => setCurrentStaff({ ...currentStaff, role: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">مدير نظام (Platform Admin)</SelectItem>
                                        <SelectItem value="employee">موظف منصة (Platform Employee)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Role-specific fields removed to focus on Platform Admins */}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSaveStaff} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            حفظ البيانات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default StaffManagement;

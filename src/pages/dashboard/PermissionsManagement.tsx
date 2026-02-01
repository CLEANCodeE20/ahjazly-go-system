import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Loader2,
    Save,
    Shield,
    Search,
    RotateCcw,
    Bus,
    Route,
    Calendar,
    Users,
    CreditCard,
    FileText,
    BarChart3,
    Settings,
    LayoutDashboard,
    XCircle,
    Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Permission {
    permission_code: string;
    description: string;
    category: string;
}

const roles = [
    { value: "manager", label: "مدير فرع" },
    { value: "accountant", label: "محاسب" },
    { value: "driver", label: "سائق" },
    { value: "assistant", label: "مساعد" },
    { value: "support", label: "خدمة عملاء" },
    { value: "supervisor", label: "مشرف" }
];

const PermissionsManagement = () => {
    const { userRole } = useAuth(); // Get current user role
    const { partnerId } = usePartner();
    const [selectedRole, setSelectedRole] = useState("accountant");
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [initialRolePermissions, setInitialRolePermissions] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (userRole) {
            fetchMetadata();
        }
    }, [userRole]);

    useEffect(() => {
        if (selectedRole) {
            fetchRolePermissions(selectedRole);
        }
    }, [selectedRole, partnerId]);

    const fetchMetadata = async () => {
        try {
            const { data, error } = await supabase
                .from('permissions')
                .select('*')
                .order('category');

            if (error) throw error;

            let displayedPermissions = data || [];

            // SECURITY FILTER: If not SUPERUSER, hide platform-level permissions
            if (userRole?.role !== 'SUPERUSER') {
                const hiddenPermissions = [
                    'settings.manage', 'settings.edit', // Global settings
                    'partners.manage', 'partners.create', 'partners.delete', 'partners.view', // Platform management
                    'system.settings', 'audit.view_all', // System level
                    'locations.manage' // Global locations
                ];

                displayedPermissions = displayedPermissions.filter(p =>
                    !hiddenPermissions.includes(p.permission_code) &&
                    !p.permission_code.startsWith('platform.') // Future proofing
                );
            }

            setPermissions(displayedPermissions);
        } catch (error: any) {
            console.error('Error fetching permissions:', error);
            toast({
                title: "خطأ في جلب البيانات",
                description: "تعذر تحميل قائمة الصلاحيات.",
                variant: "destructive"
            });
        }
    };

    const fetchRolePermissions = async (role: string) => {
        setLoading(true);
        try {
            // Fetch permissions for this role.
            // Logic: If partner has custom permissions, use them. If not, use system defaults (partner_id is null).

            let codes: string[] = [];

            if (partnerId) {
                // 1. Check if partner has custom permissions for this role
                const { data: customData, error: customError } = await supabase
                    .from('role_permissions')
                    .select('permission_code')
                    .eq('role', role)
                    .eq('partner_id', partnerId);

                if (customError) throw customError;

                if (customData && customData.length > 0) {
                    // Partner has customized this role
                    codes = customData.map(p => p.permission_code);
                } else {
                    // Fallback to system defaults
                    const { data: defaultData, error: defaultError } = await supabase
                        .from('role_permissions')
                        .select('permission_code')
                        .eq('role', role)
                        .is('partner_id', null);

                    if (defaultError) throw defaultError;
                    codes = defaultData?.map(p => p.permission_code) || [];
                }
            } else {
                // No partner_id - fetch system defaults only
                const { data: defaultData, error: defaultError } = await supabase
                    .from('role_permissions')
                    .select('permission_code')
                    .eq('role', role)
                    .is('partner_id', null);

                if (defaultError) throw defaultError;
                codes = defaultData?.map(p => p.permission_code) || [];
            }

            setRolePermissions(codes);
            setInitialRolePermissions(codes);
        } catch (error) {
            console.error('Error fetching role permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetToDefaults = async () => {
        if (!partnerId) return;
        setIsResetting(true);
        try {
            const { error } = await supabase
                .from('role_permissions')
                .delete()
                .eq('partner_id', partnerId)
                .eq('role', selectedRole);

            if (error) throw error;

            toast({ title: "تمت الاستعادة", description: "تمت العودة للصلاحيات الافتراضية للنظام" });
            fetchRolePermissions(selectedRole);
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        } finally {
            setIsResetting(false);
        }
    };

    const handleTogglePermission = (code: string) => {
        setRolePermissions(prev =>
            prev.includes(code)
                ? prev.filter(p => p !== code)
                : [...prev, code]
        );
    };

    const handleSave = async () => {
        if (!partnerId) return;
        setSaving(true);
        try {
            // 1. Delete existing custom permissions for this partner/role
            const { error: delError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('partner_id', partnerId)
                .eq('role', selectedRole);

            if (delError) throw delError;

            // 2. Insert new ones
            if (rolePermissions.length > 0) {
                const toInsert = rolePermissions.map(code => ({
                    partner_id: partnerId,
                    role: selectedRole,
                    permission_code: code
                }));

                const { error: insError } = await supabase
                    .from('role_permissions')
                    .insert(toInsert);

                if (insError) throw insError;
            }

            toast({ title: "تم الحفظ", description: "تم تحديث الصلاحيات بنجاح" });
            setInitialRolePermissions(rolePermissions); // Update initial state to reflect saved
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = JSON.stringify([...rolePermissions].sort()) !== JSON.stringify([...initialRolePermissions].sort());

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'الأسطول': return <Bus className="w-4 h-4" />;
            case 'المسارات': return <Route className="w-4 h-4" />;
            case 'الرحلات': return <Calendar className="w-4 h-4" />;
            case 'المستخدمين': return <Users className="w-4 h-4" />;
            case 'الحجوزات': return <CreditCard className="w-4 h-4" />;
            case 'التقارير': return <FileText className="w-4 h-4" />;
            case 'المالية': return <BarChart3 className="w-4 h-4" />;
            case 'الإعدادات': return <Settings className="w-4 h-4" />;
            default: return <Shield className="w-4 h-4" />;
        }
    };

    const filteredPermissions = permissions.filter(p =>
        p.description.includes(searchQuery) || p.permission_code.includes(searchQuery) || p.category.includes(searchQuery)
    );

    const groupedPermissions = filteredPermissions.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="p-6 space-y-6 bg-background/50 min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">إدارة الصلاحيات المتقدمة</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">تحكم دقيق في صلاحيات الوصول لكل دور وظيفي</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none gap-2" disabled={loading || isResetting}>
                                <RotateCcw className={cn("w-4 h-4", isResetting && "animate-spin")} />
                                استعادة الافتراضي
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>استعادة الصلاحيات الافتراضية؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    سيتم إلغاء جميع التخصيصات لهذا الدور والعودة للإعدادات الأساسية للنظام.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>تراجع</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetToDefaults}>تأكيد</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button onClick={handleSave} disabled={saving || loading || !hasChanges} className="flex-1 md:flex-none shadow-lg shadow-primary/20">
                        {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                        حفظ التغييرات
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-80 space-y-4">
                    <Card className="border-primary/10 shadow-sm overflow-hidden">
                        <div className="h-1 bg-gradient-to-l from-primary to-secondary" />
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                الدور الوظيفي
                            </CardTitle>
                            <CardDescription>اختر الدور لتعديل صلاحياته</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-12 text-sm font-bold border-muted-foreground/20 bg-muted/30">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.value} value={role.value} className="font-bold py-3">
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث..."
                                    className="pr-10 h-10 bg-muted/20 border-muted-foreground/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground font-bold">جاري تحميل الصلاحيات...</p>
                        </div>
                    ) : permissions.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            لا توجد بيانات للصلاحيات.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                                <Card key={category} className="border-border/50 shadow-sm hover:border-primary/30 transition-all duration-300">
                                    <CardHeader className="pb-3 bg-muted/20">
                                        <CardTitle className="text-sm font-black flex items-center gap-2 text-primary">
                                            {getCategoryIcon(category)}
                                            {category}
                                            <Badge variant="secondary" className="mr-auto font-mono text-[10px] bg-primary/10 text-primary border-none">
                                                {perms.length}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-2 pt-4">
                                        {perms.map(perm => {
                                            const isChecked = rolePermissions.includes(perm.permission_code);
                                            return (
                                                <div
                                                    key={perm.permission_code}
                                                    className={cn(
                                                        "flex items-center group p-2 rounded-lg transition-all cursor-pointer",
                                                        isChecked ? "bg-primary/[0.05]" : "hover:bg-muted/50"
                                                    )}
                                                    onClick={() => handleTogglePermission(perm.permission_code)}
                                                >
                                                    <Checkbox
                                                        id={perm.permission_code}
                                                        checked={isChecked}
                                                        onCheckedChange={() => handleTogglePermission(perm.permission_code)}
                                                        className="mr-2 h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                    <div className="grid gap-1.5 leading-none mr-3">
                                                        <label
                                                            htmlFor={perm.permission_code}
                                                            className="text-sm font-bold leading-none cursor-pointer group-hover:text-primary transition-colors"
                                                        >
                                                            {perm.description}
                                                        </label>
                                                        <span className="text-[9px] font-mono text-muted-foreground opacity-70">
                                                            {perm.permission_code}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionsManagement;

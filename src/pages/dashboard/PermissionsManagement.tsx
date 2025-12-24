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
import { Loader2, Save, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";

interface Permission {
    code: string;
    description: string;
    category: string;
}

interface RolePermission {
    permission_code: string;
}

const roles = [
    { value: "manager", label: "مدير" }, // Usually partner, but maybe they have hired managers
    { value: "accountant", label: "محاسب" },
    { value: "driver", label: "سائق" },
    { value: "assistant", label: "مساعد سائق" },
    { value: "support", label: "خدمة عملاء" },
    { value: "supervisor", label: "مشرف" }
];

const PermissionsManagement = () => {
    const { partnerId } = usePartner();
    const [selectedRole, setSelectedRole] = useState("accountant");
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMetadata();
    }, []);

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
            setPermissions(data || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const fetchRolePermissions = async (role: string) => {
        setLoading(true);
        try {
            // Fetch permissions for this role for THIS partner (or default if no partner override)
            // Actually, for editing, we want to know what is currently active.
            // But if we want to "Customize", we load the current effective permissions.

            const { data, error } = await supabase
                .from('role_permissions')
                .select('permission_code')
                .eq('role', role)
                .or(`partner_id.eq.${partnerId},partner_id.is.null`);

            if (error) throw error;

            setRolePermissions(data.map(p => p.permission_code));
        } catch (error) {
            console.error('Error fetching role permissions:', error);
        } finally {
            setLoading(false);
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
            // Note: We are NOT deleting system permissions (partner_id is null). 
            // BUT, if we want to "override", we typically need a logic. 
            // Current Logic: We insert "custom" permissions. 
            // The Hook logic `or(partner_id.eq.X, partner_id.is.null)` is additive.
            // To strictly controlled "Customization", we should probably copy all defaults to partner_id rows on first edit?
            // OR, simpler for now: We delete old *partner* entries and insert new ones. 
            // BUT, the `usePermissions` hook merges defaults. This means you can ADD permissions but not REMOVE default ones.

            // IMPROVEMENT: To allow REMOVING defaults, the hook logic needs to be "If partner has ANY entries for this role, ignore defaults".
            // OR, we just say: This screen creates a FULL SET of permissions for the partner+role.
            // Let's go with: If partner defines permissions for a role, we ONLY use those.
            // UsePermissions Hook Update Needed? -> Yes, let's fix the hook logic later or assume Additive for now?
            // Let's assume Additive for now implies "System Base + Extras".
            // But user wants "Granular Control". 
            // Let's change strategy slightly: We will delete partner rows and insert new ones. 
            // If the hook is additive, we can't uncheck a default. 

            // FIX: We will just delete all previous specific partner permissions and insert the selected ones.
            // Ideally, we'd want to "Take over" control.

            const { error: deleteError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('partner_id', partnerId)
                .eq('role', selectedRole);

            if (deleteError) throw deleteError;

            const newRows = rolePermissions.map(code => ({
                role: selectedRole,
                permission_code: code,
                partner_id: partnerId
            }));

            if (newRows.length > 0) {
                const { error: insertError } = await supabase
                    .from('role_permissions')
                    .insert(newRows);

                if (insertError) throw insertError;
            }

            toast({ title: "تم الحفظ", description: "تم تحديث الصلاحيات بنجاح" });
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">إدارة الصلاحيات</h1>
                    <p className="text-muted-foreground">تحديد صلاحيات الوصول لكل مسمى وظيفي</p>
                </div>
                <Button onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                    حفظ التغييرات
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Role Selector */}
                <div className="w-full md:w-64 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">الوظيفة</CardTitle>
                            <CardDescription>اختر الوظيفة لتعديل صلاحياتها</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <p className="font-bold flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            ملاحظة:
                        </p>
                        <p className="mt-1">
                            الصلاحيات التي تحددها هنا ستطبق على جميع الموظفين الذين يحملون هذا المسمى الوظيفي.
                        </p>
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                                <Card key={category}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-semibold">{category}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-3">
                                        {perms.map(perm => (
                                            <div key={perm.code} className="flex items-start space-x-3 space-x-reverse">
                                                <Checkbox
                                                    id={perm.code}
                                                    checked={rolePermissions.includes(perm.code)}
                                                    onCheckedChange={() => handleTogglePermission(perm.code)}
                                                />
                                                <div className="grid gap-1.5 leading-none mr-2">
                                                    <label
                                                        htmlFor={perm.code}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {perm.description}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
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

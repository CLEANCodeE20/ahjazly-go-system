import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Permission {
    code: string;
}

export const usePermissions = () => {
    const { user, userRole, isLoading: authLoading } = useAuth();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !userRole) {
            setPermissions([]);
            setLoading(false);
            return;
        }

        const fetchPermissions = async () => {
            setLoading(true);
            try {
                let roleName: string | null = null;
                let partnerId = userRole.partner_id;

                // 1. Determine the effective role name
                if (userRole.role === 'admin') {
                    // Admins have all permissions implicitly, or we can fetch a wildcard
                    roleName = 'admin';
                } else if (userRole.role === 'partner') {
                    // Partners are "managers" of their company
                    roleName = 'manager';
                } else if (userRole.role === 'employee') {
                    // For employees, we need their specific job title from the employees table
                    const { data: empData, error: empError } = await supabase
                        .from('employees')
                        .select('role_in_company')
                        .eq('user_id', user.id)
                        .single();

                    if (!empError && empData) {
                        roleName = empData.role_in_company;
                    }
                }

                if (!roleName) {
                    setPermissions([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch permissions for this role
                // Logic: Get permissions specifically for this partner, OR system defaults (partner_id is null) for this role
                // If a partner has overridden a role, we might want to ONLY show partner permissions, or merge.
                // For now, let's assume we fetch all matches.

                const { data, error } = await supabase
                    .from('role_permissions')
                    .select('permission_code')
                    .eq('role', roleName)
                    .or(`partner_id.eq.${partnerId},partner_id.is.null`);

                if (error) {
                    console.error('Error fetching permissions:', error);
                    setPermissions([]);
                } else {
                    const codes = data.map(p => p.permission_code);
                    setPermissions(codes);
                }

            } catch (err) {
                console.error('Error in usePermissions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [user, userRole, authLoading]);

    // Helper to check if user has a permission
    const can = (permissionCode: string) => {
        // Admins and Partners (Managers) might have bypass, but let's stick to the loaded permissions list for consistency.
        // Exception: Admin role in app might just return true always.
        if (userRole?.role === 'admin') return true;

        return permissions.includes(permissionCode);
    };

    // Helper to check multiple permissions (OR)
    const canAny = (permissionCodes: string[]) => {
        if (userRole?.role === 'admin') return true;
        return permissionCodes.some(code => permissions.includes(code));
    };

    return {
        permissions,
        loading,
        can,
        canAny
    };
};

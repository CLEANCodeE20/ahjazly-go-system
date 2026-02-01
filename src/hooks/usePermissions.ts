import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Permission {
    code: string;
}

// Helper function to get default permissions based on role
function getRoleDefaultPermissions(role: string): string[] {
    switch (role) {
        case 'manager':
            return [
                'view_routes', 'view_trips', 'view_bookings', 'view_drivers',
                'manage_trips', 'view_reports', 'view_employees'
            ];
        case 'accountant':
            return [
                'view_payments', 'manage_payments', 'view_bookings',
                'view_reports', 'view_financial_reports', 'manage_refunds'
            ];
        case 'support':
            return [
                'view_bookings', 'view_trips', 'view_routes',
                'view_customers', 'manage_support_tickets'
            ];
        case 'supervisor':
            return [
                'view_routes', 'view_trips', 'view_drivers', 'view_buses',
                'manage_trips', 'view_reports'
            ];
        case 'driver':
            return ['view_own_trips', 'update_trip_status', 'view_own_schedule'];
        default:
            // For unknown roles, give minimal permissions
            return ['view_dashboard'];
    }
}

export const usePermissions = () => {
    const { user, userRole, isLoading: authLoading } = useAuth();
    // Start with empty permissions
    const [permissions, setPermissions] = useState<{ action: string, resource: string, code: string }[]>([]);
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
                let roleName = userRole.role;
                let partnerId = userRole.partner_id;

                // SUPERUSER bypass
                if (roleName === 'SUPERUSER') {
                    setPermissions([{ action: '*', resource: '*', code: '*' }]);
                    setLoading(false);
                    return;
                }

                if (!roleName) {
                    setPermissions([]);
                    setLoading(false);
                    return;
                }

                // Fetch standard permissions from role_permissions joined with permissions table
                // We assume there is a FK or joining on code. Since our migration didn't enforce FK on code yet,
                // we'll try to join if possible, or fetch raw codes then fetch details.
                // Assuming 'role_permissions' has 'permission_code' and 'permissions' table has 'permission_code'

                // Optimized Query:
                // SELECT p.action, p.resource, p.permission_code 
                // FROM role_permissions rp
                // JOIN permissions p ON p.permission_code = rp.permission_code
                // WHERE rp.role = roleName AND ...

                const { data: rawPerms, error } = await supabase
                    .from('role_permissions')
                    .select(`
                        permission_code,
                        permissions!inner (
                            action,
                            resource
                        )
                    `)
                    .eq('role', roleName)
                    .or(partnerId ? `partner_id.eq.${partnerId},partner_id.is.null` : `partner_id.is.null`) as any;

                if (error || !rawPerms) {
                    console.warn('[Permissions] Failed to fetch fine-grained permissions, falling back to defaults');
                    // Fallback to defaults (convert codes to pseudo action/resource)
                    const defaults = getRoleDefaultPermissions(roleName);
                    const mappedDefaults = defaults.map(code => ({
                        code,
                        action: code.split('_')[0] || 'read',
                        resource: code.split('_').slice(1).join('_') || code
                    }));
                    setPermissions(mappedDefaults);
                } else {
                    // map response
                    const mapped = rawPerms.map((p: any) => ({
                        code: p.permission_code,
                        action: p.permissions?.action || 'read',
                        resource: p.permissions?.resource || p.permission_code
                    }));
                    setPermissions(mapped);
                }

            } catch (err) {
                console.error('[Permissions] Critical error:', err);
                setPermissions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [user, userRole, authLoading]);

    // Check by action + resource (The Gold Standard)
    const hasPermission = (action: string, resource: string) => {
        if (permissions.some(p => p.code === '*')) return true; // Superuser

        return permissions.some(p =>
            (p.action === action || p.action === 'manage') && // 'manage' implies all actions
            (p.resource === resource || p.resource === '*')
        );
    };

    // Legacy check by code
    const can = (permissionCode: string) => {
        if (permissions.some(p => p.code === '*')) return true;
        return permissions.some(p => p.code === permissionCode);
    };

    const canAny = (permissionCodes: string[]) => {
        if (permissions.some(p => p.code === '*')) return true;
        return permissionCodes.some(code => can(code));
    };

    return {
        permissions, // now array of objects
        loading,
        hasPermission, // New standard method
        can,           // Legacy support
        canAny,        // Legacy support
    };
};

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    children,
    fallback = null
}) => {
    const { hasPermission, isLoading } = usePermissions();

    if (isLoading) {
        return null; // Or a skeleton if needed, but usually we want to just hide
    }

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

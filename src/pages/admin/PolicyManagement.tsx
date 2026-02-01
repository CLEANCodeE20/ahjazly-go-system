import { useState } from "react";
import {
    FileText,
    Plus,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Policy {
    id: string;
    title: string;
    content: string;
    type: 'internal' | 'public' | 'terms' | 'privacy';
    status: 'active' | 'draft' | 'archived';
    version: string;
    updated_at: string;
}

/**
 * Policy Management Page - Placeholder
 * Note: policies table doesn't exist in the database yet.
 * This page shows a placeholder until the table is created.
 */
const PolicyManagement = () => {
    const [policies] = useState<Policy[]>([]);
    const [loading] = useState(false);

    return (
        <AdminLayout
            title="إدارة السياسات"
            subtitle="صياغة ونشر سياسات الشركة والشروط والأحكام"
            actions={
                <Button disabled>
                    <Plus className="w-4 h-4 ml-2" />
                    سياسة جديدة
                </Button>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            إدارة السياسات
                        </CardTitle>
                        <CardDescription>
                            إدارة سياسات الشركة والشروط والأحكام
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">ميزة قيد التطوير</h3>
                            <p className="text-muted-foreground max-w-md">
                                إدارة السياسات غير متاحة حالياً. سيتم تفعيل هذه الميزة قريباً
                                لإدارة الشروط والأحكام وسياسات الخصوصية.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default PolicyManagement;

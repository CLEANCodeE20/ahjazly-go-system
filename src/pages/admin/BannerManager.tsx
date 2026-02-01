import { useState } from "react";
import {
    Image as ImageIcon,
    Plus,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Banner {
    id: number;
    title: string;
    image_url: string;
    target_url: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

/**
 * Banner Manager Page - Placeholder
 * Note: banners table doesn't exist in the database yet.
 * This page shows a placeholder until the table is created.
 */
const BannerManager = () => {
    const [banners] = useState<Banner[]>([]);
    const [loading] = useState(false);

    return (
        <AdminLayout
            title="إدارة السلايدر الإعلاني"
            subtitle="التحكم في الصور والعروض المتحركة في واجهة التطبيق الرئيسية"
            actions={
                <Button disabled>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة إعلان جديد
                </Button>
            }
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            إدارة البانرات
                        </CardTitle>
                        <CardDescription>
                            إدارة صور السلايدر والإعلانات في الصفحة الرئيسية
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">ميزة قيد التطوير</h3>
                            <p className="text-muted-foreground max-w-md">
                                إدارة البانرات غير متاحة حالياً. سيتم تفعيل هذه الميزة قريباً
                                لإدارة الإعلانات والعروض في الصفحة الرئيسية.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default BannerManager;

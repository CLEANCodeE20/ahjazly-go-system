import { useState } from "react";
import {
    MapPin,
    Search,
    Plus,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface City {
    id: string;
    name_ar: string;
    name_en: string;
    region: string;
    is_active: boolean;
    code: string;
    created_at?: string;
}

/**
 * City Management Page - Placeholder
 * Note: cities table doesn't exist in the database yet.
 * This page shows a placeholder until the table is created.
 * Cities are currently managed through routes table (origin_city, destination_city columns).
 */
const CityManagement = () => {
    const [cities] = useState<City[]>([]);
    const [loading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <AdminLayout
            title="إدارة المدن"
            actions={
                <Button disabled>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مدينة
                </Button>
            }
        >
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن مدينة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-full md:w-1/3"
                        disabled
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        إدارة المدن
                    </CardTitle>
                    <CardDescription>
                        إدارة قائمة المدن المتاحة في النظام
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">ميزة قيد التطوير</h3>
                        <p className="text-muted-foreground max-w-md">
                            إدارة المدن بشكل منفصل غير متاحة حالياً. 
                            المدن حالياً تُدار من خلال جدول المسارات (origin_city, destination_city).
                            سيتم إضافة جدول منفصل للمدن قريباً.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default CityManagement;

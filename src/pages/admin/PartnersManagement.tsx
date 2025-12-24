import { useState, useEffect } from "react";
import {
    Building2,
    Search,
    MoreVertical,
    Eye,
    Edit,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Loader2,
    Mail,
    Phone,
    MapPin,
    FileText
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

interface Partner {
    partner_id: number;
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    commission_percentage: number;
    created_at: string;
}

const PartnersManagement = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('partners')
            .select('*')
            .order('company_name');

        if (error) {
            console.error('Error fetching partners:', error);
            toast({
                title: "خطأ",
                description: "فشل في تحميل بيانات الشركاء",
                variant: "destructive"
            });
        } else {
            setPartners(data || []);
        }
        setLoading(false);
    };

    const updatePartnerStatus = async (partnerId: number, newStatus: string) => {
        const { error } = await supabase
            .from('partners')
            .update({ status: newStatus })
            .eq('partner_id', partnerId);

        if (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث حالة الشريك",
                variant: "destructive"
            });
        } else {
            toast({
                title: "تم التحديث",
                description: `تم تغيير حالة الشريك إلى ${newStatus === 'approved' ? 'نشط' : 'موقوف'}`,
            });
            fetchPartners();
        }
    };

    const filteredPartners = partners.filter(p =>
        p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">الشركاء المسجلين</h1>
                        <p className="text-muted-foreground">إدارة شركات النقل المتعاقد معها</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث عن شركة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-9 w-64"
                            />
                        </div>
                        <Button>
                            <Building2 className="w-4 h-4 ml-2" />
                            إضافة شريك جديد
                        </Button>
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
                                    <TableHead className="text-right">الشركة</TableHead>
                                    <TableHead className="text-right">المسؤول</TableHead>
                                    <TableHead className="text-right">العمولة</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">تاريخ الانضمام</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPartners.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            لا يوجد شركاء مطابقين للبحث
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPartners.map((partner) => (
                                        <TableRow key={partner.partner_id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{partner.company_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{partner.contact_person || "-"}</TableCell>
                                            <TableCell>{partner.commission_percentage}%</TableCell>
                                            <TableCell>
                                                {partner.status === 'approved' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle2 className="w-3 h-3" /> نشط
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        <XCircle className="w-3 h-3" /> موقوف
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground text-left" dir="ltr">
                                                {new Date(partner.created_at).toLocaleDateString('ar-SA')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="w-4 h-4 ml-2" /> تفاصيل الشركة
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="w-4 h-4 ml-2" /> تعديل البيانات
                                                        </DropdownMenuItem>
                                                        {partner.status === 'approved' ? (
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => updatePartnerStatus(partner.partner_id, 'suspended')}
                                                            >
                                                                <ShieldAlert className="w-4 h-4 ml-2" /> إيقاف الحساب
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                className="text-green-600"
                                                                onClick={() => updatePartnerStatus(partner.partner_id, 'approved')}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4 ml-2" /> تفعيل الحساب
                                                            </DropdownMenuItem>
                                                        )}
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

export default PartnersManagement;

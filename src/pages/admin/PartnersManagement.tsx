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
    FileText,
    Download,
    FileSpreadsheet,
    UploadCloud,
    Trash,
    Image as ImageIcon
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
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
import { AdminLayout } from "@/components/layout/AdminLayout";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface Partner {
    partner_id: number;
    company_name: string;
    contact_person: string | null;
    address: string | null;
    status: string | null;
    commission_percentage: number | null;
    created_at: string | null;

    // Extended Profile
    commercial_registration?: string;
    tax_number?: string;
    website?: string;
    logo_url?: string;

    // Owner Info
    owner_name?: string;
    owner_phone?: string;
    owner_email?: string;

    // Financial Info
    bank_name?: string;
    iban?: string;
    account_number?: string;
    swift_code?: string;
}

const DocumentUploadItem = ({ docItem, partnerId }: {
    docItem: { id: string; label: string; type: string; dbValue: string; required: boolean };
    partnerId?: number;
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${docItem.type}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('partner-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('partner-documents')
                .getPublicUrl(filePath);

            setUploadedUrl(publicUrl);

            if (partnerId) {
                await supabase.from('documents').insert({
                    partner_id: partnerId,
                    document_type: docItem.dbValue as any,
                    document_url: publicUrl,
                    document_number: fileName,
                    verification_status: 'pending'
                });
            }

            toast({ title: "تم رفع الملف", description: `تم رفع ${docItem.label} بنجاح` });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({ title: "خطأ", description: "فشل في رفع الملف", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">
                    <FileText className={`w-5 h-5 ${uploadedUrl ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-sm">
                        {docItem.label}
                        {docItem.required && <span className="text-red-500 mr-1">*</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">PDF, PNG, JPG (Max 5MB)</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="file"
                    id={`file-${docItem.id}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                />
                <Button
                    variant={uploadedUrl ? "outline" : "secondary"}
                    size="sm"
                    className={`gap-2 relative overflow-hidden ${uploadedUrl ? 'border-green-500 text-green-600 bg-green-50' : ''}`}
                    onClick={() => document.getElementById(`file-${docItem.id}`)?.click()}
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : (uploadedUrl ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />)}
                    {uploading ? 'جاري الرفع...' : (uploadedUrl ? 'تم الرفع' : 'رفع الملف')}
                </Button>
            </div>
        </div>
    );
};

const PartnersManagement = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { exportToExcel, exportToPDF } = useExport();
    const [partnerDocuments, setPartnerDocuments] = useState<any[]>([]);
    const [fetchingDocs, setFetchingDocs] = useState(false);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('partners')
            .select(`
                *,
                manager:users!partners_manager_auth_public_fkey(
                    auth_id,
                    full_name,
                    email,
                    phone_number
                )
            `)
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

    const updatePartnerStatus = async (partnerId: number, newStatus: "approved" | "pending" | "rejected" | "suspended") => {
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
        p.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p as any).manager?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExport = (type: 'excel' | 'pdf') => {
        const dataToExport = filteredPartners.map(p => ({
            'اسم الشركة': p.company_name,
            'المسؤول': p.contact_person || '-',
            'العمولة (%)': p.commission_percentage,
            'الحالة': p.status === 'approved' ? 'نشط' : 'موقوف',
            'تاريخ الانضمام': new Date(p.created_at || '').toLocaleDateString('ar-SA')
        }));

        if (type === 'excel') {
            exportToExcel(dataToExport, 'partners_list');
        } else {
            exportToPDF(
                dataToExport,
                [
                    { header: 'اسم الشركة', key: 'اسم الشركة' },
                    { header: 'المسؤول', key: 'المسؤول' },
                    { header: 'العمولة (%)', key: 'العمولة (%)' },
                    { header: 'الحالة', key: 'الحالة' },
                    { header: 'تاريخ الانضمام', key: 'تاريخ الانضمام' }
                ],
                { title: 'قائمة الشركاء' }
            );
        }
    };

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPartner, setCurrentPartner] = useState<Partial<Partner>>({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchDocuments = async (partnerId: number) => {
        setFetchingDocs(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('partner_id', partnerId);

        if (error) {
            console.error('Error fetching documents:', error);
        } else {
            setPartnerDocuments(data || []);
        }
        setFetchingDocs(false);
    };

    const openDialog = (partner?: Partner) => {
        if (partner) {
            setCurrentPartner({ ...partner });
            fetchDocuments(partner.partner_id);
        } else {
            setCurrentPartner({
                company_name: "",
                contact_person: "",
                address: "",
                commission_percentage: 0,
                status: "approved"
            });
            setPartnerDocuments([]);
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!currentPartner.company_name) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال اسم الشركة",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                company_name: currentPartner.company_name,
                contact_person: currentPartner.contact_person,
                address: currentPartner.address,
                commission_percentage: currentPartner.commission_percentage || 0,
                status: (currentPartner.status || 'approved') as "approved" | "pending" | "rejected" | "suspended",

                // Extended
                commercial_registration: currentPartner.commercial_registration,
                tax_number: currentPartner.tax_number,
                website: currentPartner.website,
                logo_url: currentPartner.logo_url,

                bank_name: currentPartner.bank_name,
                iban: currentPartner.iban,
                account_number: currentPartner.account_number,
                swift_code: currentPartner.swift_code,
                manager_auth_id: (currentPartner as any).manager_auth_id
            };

            let error;
            if (currentPartner.partner_id) {
                const { error: updateError } = await supabase
                    .from('partners')
                    .update(payload)
                    .eq('partner_id', currentPartner.partner_id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('partners')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast({
                title: "تم الحفظ",
                description: currentPartner.partner_id ? "تم تحديث بيانات الشريك" : "تم إضافة شريك جديد",
            });
            setIsDialogOpen(false);
            fetchPartners();
        } catch (error: any) {
            console.error('Error saving partner:', error);
            toast({
                title: "خطأ",
                description: "فشل في حفظ بيانات الشريك",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout
            title="الشركاء المسجلين"
            subtitle="إدارة شركات النقل المتعاقد معها"
            actions={
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                                <Download className="w-4 h-4" />
                                تصدير
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('excel')}>
                                <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                <FileText className="w-4 h-4 ml-2 text-red-600" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={() => openDialog()} size="sm">
                        <Building2 className="w-4 h-4 ml-2" />
                        <span className="hidden sm:inline">إضافة شريك جديد</span>
                        <span className="sm:hidden">إضافة</span>
                    </Button>
                </div>
            }
        >
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن شركة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-full md:w-1/3"
                    />
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                            <TableCell>
                                                {(partner as any).manager?.full_name || partner.contact_person || "-"}
                                            </TableCell>
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
                                                {new Date(partner.created_at || '').toLocaleDateString('ar-SA')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openDialog(partner)}>
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
                    </div>
                )}
            </div>

            {/* Partner Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-card w-full max-w-2xl rounded-xl border shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-semibold mb-4">
                            {currentPartner.partner_id ? "تعديل بيانات الشريك" : "إضافة شريك جديد"}
                        </h2>
                        <Tabs defaultValue="company" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="company">الشركة</TabsTrigger>
                                <TabsTrigger value="owner">المالك</TabsTrigger>
                                <TabsTrigger value="financial">المالية</TabsTrigger>
                                <TabsTrigger value="documents">المستندات</TabsTrigger>
                            </TabsList>

                            <TabsContent value="company" className="space-y-4 pt-4">
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                                            {currentPartner.logo_url ? (
                                                <img src={currentPartner.logo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <label htmlFor="logo-upload" className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                                                    <UploadCloud className="w-5 h-5 text-white" />
                                                </label>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            id="logo-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const toastId = toast({ title: "جاري الرفع...", description: "يتم الآن رفع شعار الشركة" });
                                                try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `logo_${Date.now()}.${fileExt}`;
                                                    const filePath = `${fileName}`;

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('partner-logos')
                                                        .upload(filePath, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('partner-logos')
                                                        .getPublicUrl(filePath);

                                                    setCurrentPartner({ ...currentPartner, logo_url: publicUrl });
                                                    toast({ title: "تم الرفع", description: "تم تحديث الشعار بنجاح" });
                                                } catch (error) {
                                                    console.error(error);
                                                    toast({ title: "خطأ", description: "فشل رفع الشعار", variant: "destructive" });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <Label className="text-sm font-medium">شعار الشركة</Label>
                                        <p className="text-xs text-muted-foreground mt-1">يفضل أن تكون الصورة مربعة</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>اسم الشركة</Label>
                                        <Input
                                            value={currentPartner.company_name}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, company_name: e.target.value })}
                                            placeholder="شركة النقل ..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الموقع الإلكتروني</Label>
                                        <Input
                                            value={currentPartner.website || ""}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, website: e.target.value })}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>العنوان</Label>
                                    <Input
                                        value={currentPartner.address || ""}
                                        onChange={(e) => setCurrentPartner({ ...currentPartner, address: e.target.value })}
                                        placeholder="العنوان التفصيلي"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>السجل التجاري</Label>
                                        <Input
                                            value={currentPartner.commercial_registration || ""}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, commercial_registration: e.target.value })}
                                            placeholder="رقم السجل"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الرقم الضريبي</Label>
                                        <Input
                                            value={currentPartner.tax_number || ""}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, tax_number: e.target.value })}
                                            placeholder="الرقم الضريبي"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>اسم المسؤول (للتواصل)</Label>
                                    <Input
                                        value={currentPartner.contact_person || ""}
                                        onChange={(e) => setCurrentPartner({ ...currentPartner, contact_person: e.target.value })}
                                        placeholder="مدير التشغيل / المسؤول"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="owner" className="space-y-4 pt-4">
                                {(currentPartner as any).manager ? (
                                    <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-secondary/10 rounded-full">
                                                <CheckCircle2 className="w-4 h-4 text-secondary" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-secondary-foreground text-sm">حساب مدير مرتبط</h4>
                                                <p className="text-muted-foreground text-xs mt-1">هذه البيانات مستمدة تلقائياً من حساب المستخدم الموثق.</p>
                                                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">الاسم الكامل</Label>
                                                        <p className="font-medium">{(currentPartner as any).manager.full_name}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                                                        <p className="font-medium">{(currentPartner as any).manager.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label>اسم المالك (بيانات نصية)</Label>
                                            <Input
                                                value={currentPartner.contact_person || ""}
                                                onChange={(e) => setCurrentPartner({ ...currentPartner, contact_person: e.target.value })}
                                                placeholder="الاسم الكامل للمالك"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">ملاحظة: لربط الشركة بحساب مستخدم كامل، يجب تحويل هذا الشريك لنظام الهوية الموحدة.</p>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="financial" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>نسبة العمولة (%)</Label>
                                        <Input
                                            type="number"
                                            value={currentPartner.commission_percentage || 0}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, commission_percentage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>اسم البنك</Label>
                                        <Input
                                            value={currentPartner.bank_name || ""}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, bank_name: e.target.value })}
                                            placeholder="مصرف الراجحي"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>رقم الحساب (IBAN)</Label>
                                    <Input
                                        value={currentPartner.iban || ""}
                                        onChange={(e) => setCurrentPartner({ ...currentPartner, iban: e.target.value })}
                                        placeholder="SA.................."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>رقم الحساب</Label>
                                        <Input
                                            value={currentPartner.account_number || ""}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, account_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Swift Code</Label>
                                        <Input
                                            value={currentPartner.swift_code || ""}
                                            onChange={(e) => setCurrentPartner({ ...currentPartner, swift_code: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="documents" className="space-y-6 pt-4">
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-900 text-sm">متطلبات الانضمام</h4>
                                            <p className="text-blue-700 text-xs mt-1">يرجى رفع النسخ الأصلية (PDF أو صور واضحة) للمستندات التالية لإكمال طلب الانضمام.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {fetchingDocs ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    ) : partnerDocuments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {partnerDocuments.map((doc) => (
                                                <div key={doc.document_id} className="flex items-center justify-between border p-4 rounded-lg bg-card">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-primary/10 rounded">
                                                            <FileText className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {doc.document_type === 'registration' ? 'السجل التجاري' :
                                                                    doc.document_type === 'tax_certificate' ? 'الشهادة الضريبية' :
                                                                        doc.document_type === 'license' ? 'الرخصة' : 'مستند آخر'}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                رقم: {doc.document_number || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.verification_status === 'approved' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        ) : doc.verification_status === 'rejected' ? (
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <Clock className="w-4 h-4 text-amber-500" />
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                                                <Eye className="w-4 h-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                            <p className="text-muted-foreground text-sm">لا توجد مستندات مرفوعة حالياً</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground bg-muted p-2 rounded justify-center">
                                    <ShieldAlert className="w-4 h-4" />
                                    جميع المستندات يتم تشفيرها وحفظها بشكل آمن وفق معايير الهيئة.
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <div className="text-xs text-muted-foreground">
                                * الحقول الإجبارية مطلوبة لإرسال الطلب
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentPartner.partner_id ? "حفظ التغييرات" : "إرسال الطلب")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default PartnersManagement;



import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
    Clock,
    Mail,
    Phone,
    MapPin,
    FileText,
    Download,
    FileSpreadsheet,
    UploadCloud,
    Trash,
    Image as ImageIcon,
    Ban,
    ExternalLink,
    Users,
    Smartphone,
    User,
    Shield
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { createPortal } from "react-dom";
import { PartnersReport, type PartnerReportData } from "@/components/reports/PartnersReport/PartnersReport";
import { ArabicFormatter } from "@/utils/formatters/ArabicFormatter";

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

interface PartnerApplication {
    application_id: number;
    owner_name: string;
    owner_phone: string;
    owner_email: string;
    owner_id_number: string | null;
    company_name: string;
    company_email: string | null;
    company_phone: string | null;
    company_address: string | null;
    company_city: string;
    fleet_size: number | null;
    commercial_register_url: string | null;
    tax_certificate_url: string | null;
    description: string | null;
    status: string;
    rejection_reason: string | null;
    created_at: string;
    auth_user_id: string | null;
    tax_number: string | null;
    website: string | null;
    commercial_registration: string | null;
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
    const [showPrintReport, setShowPrintReport] = useState(false);
    const [reportData, setReportData] = useState<PartnerReportData | null>(null);
    const { user } = useAuth();

    // Application States
    const [applications, setApplications] = useState<PartnerApplication[]>([]);
    const [appsLoading, setAppsLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const [appFilterStatus, setAppFilterStatus] = useState<string>("all");
    const [searchParams] = useSearchParams();
    const defaultTab = searchParams.get("tab") === "applications" ? "applications" : "partners";
    const [appSearchQuery, setAppSearchQuery] = useState("");

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.company_name?.includes(appSearchQuery) ||
            app.owner_name?.includes(appSearchQuery) ||
            app.owner_email?.includes(appSearchQuery);
        const matchesFilter = appFilterStatus === "all" || app.status === appFilterStatus;
        return matchesSearch && matchesFilter;
    });

    useEffect(() => {
        fetchPartners();
        fetchApplications();
    }, []);

    const sendNotification = async (email: string, name: string, title: string, message: string, auth_id?: string | null) => {
        try {
            console.log(`[Notification] Sending to: ${email}`);
            const { data, error } = await supabase.functions.invoke('notify', {
                body: {
                    email,
                    name,
                    title,
                    message,
                    auth_id: auth_id || undefined,
                    action_url: window.location.origin + '/auth'
                }
            });

            if (error) throw error;

            console.log('Notification sent successfully:', data);
        } catch (error) {
            console.error('Error sending notification:', error);
            toast({
                title: "تنبيه",
                description: "فشل إرسال الإشعار البريدي، لكن تم تنفيذ العملية بنجاح",
                variant: "destructive"
            });
        }
    };

    const fetchApplications = async () => {
        setAppsLoading(true);
        const { data, error } = await supabase
            .from('partner_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching applications:', error);
            toast({
                title: "خطأ",
                description: "فشل في تحميل الطلبات",
                variant: "destructive"
            });
        } else {
            setApplications(data as any[] || []);
        }
        setAppsLoading(false);
    };

    const getAppStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
            case "under_review":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"><Eye className="w-3 h-3" /> قيد الفحص</span>;
            case "approved":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مقبول</span>;
            case "rejected":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> مرفوض</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status}</span>;
        }
    };

    const handleApproveApp = async (application: PartnerApplication) => {
        setProcessing(true);
        try {
            const { data: partner, error: partnerError } = await supabase
                .from('partners')
                .insert({
                    company_name: application.company_name,
                    contact_person: application.owner_name,
                    address: application.company_address
                        ? `${application.company_address}, ${application.company_city}`
                        : application.company_city,
                    status: 'approved',
                    commission_percentage: 10,
                    commercial_registration: application.commercial_registration || null,
                    tax_number: (application.tax_number && /^\d{15}$/.test(application.tax_number)) ? application.tax_number : null,
                    website: application.website
                })
                .select()
                .single();

            if (partnerError) throw partnerError;

            if (application.auth_user_id) {
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .upsert({
                        auth_id: application.auth_user_id,
                        role: 'PARTNER_ADMIN', // Reverted to 'PARTNER_ADMIN' as per user preference
                        partner_id: partner.partner_id
                    } as any);

                if (roleError) console.error('Error assigning role:', roleError);

                await supabase
                    .from('users')
                    .update({ account_status: 'active' })
                    .eq('auth_id', application.auth_user_id);

                // Insert Documents (Migrate from Application to Documents Table)
                const newDocs = [];
                if (application.commercial_register_url) {
                    newDocs.push({
                        partner_id: partner.partner_id,
                        auth_id: application.auth_user_id,
                        document_type: 'registration',
                        document_url: application.commercial_register_url,
                        document_number: application.commercial_registration || 'N/A',
                        verification_status: 'approved',
                        upload_date: new Date().toISOString()
                    });
                }
                if (application.tax_certificate_url) {
                    newDocs.push({
                        partner_id: partner.partner_id,
                        auth_id: application.auth_user_id,
                        document_type: 'other', // 'tax_certificate' not in Enum, using 'other'
                        document_url: application.tax_certificate_url,
                        document_number: application.tax_number || 'N/A',
                        verification_status: 'approved',
                        upload_date: new Date().toISOString()
                    });
                }

                if (newDocs.length > 0) {
                    const { error: docsError } = await supabase
                        .from('documents')
                        .insert(newDocs as any);
                    if (docsError) console.error('Error migrating documents:', docsError);
                }
            }

            const { error: updateError } = await supabase
                .from('partner_applications')
                .update({
                    status: 'approved',
                    partner_id: partner.partner_id,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: (user as any)?.auth_id || user?.id
                })
                .eq('application_id', application.application_id);

            if (updateError) throw updateError;

            await sendNotification(
                application.owner_email,
                application.owner_name,
                "تمت الموافقة على طلب انضمامكم - منصة أحجزلي",
                `مرحباً ${application.owner_name}،\n\nيسعدنا إبلاغك بأنه تمت الموافقة على طلب انضمام شركة ${application.company_name} كشريك في منصة أحجزلي.\nيمكنك الآن تسجيل الدخول إلى لوحة التحكم والبدء في إدارة رحلاتك.\n\nمع تحيات فريق أحجزلي`,
                application.auth_user_id
            );

            toast({
                title: "تمت الموافقة",
                description: "تم قبول طلب الشركة وإنشاء الحساب بنجاح",
            });

            setViewDialogOpen(false);
            fetchApplications();
            fetchPartners();

        } catch (error: any) {
            console.error('Error approving application:', error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في الموافقة على الطلب",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectApp = async () => {
        if (!selectedApplication) return;
        if (!rejectionReason.trim()) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال سبب الرفض",
                variant: "destructive"
            });
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('partner_applications')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: (user as any)?.auth_id || user?.id
                })
                .eq('application_id', selectedApplication.application_id);

            if (error) throw error;

            await sendNotification(
                selectedApplication.owner_email,
                selectedApplication.owner_name,
                "تحديث بخصوص طلب الانضمام - منصة أحجزلي",
                `مرحباً ${selectedApplication.owner_name}،\n\nنأسف لإبلاغك بأنه تم رفض طلب انضمام شركة ${selectedApplication.company_name} للأسباب التالية:\n${rejectionReason}\n\nيمكنك تصحيح الملاحظات وإعادة التقديم.\n\nمع تحيات فريق أحجزلي`,
                selectedApplication.auth_user_id
            );

            toast({
                title: "تم الرفض",
                description: "تم رفض طلب الشركة وإخطارها بالقرار",
            });

            setRejectDialogOpen(false);
            setViewDialogOpen(false);
            setRejectionReason("");
            fetchApplications();

        } catch (error: any) {
            console.error('Error rejecting application:', error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في رفض الطلب",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

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

    const togglePartnerSuspension = async (partner: Partner) => {
        const newStatus = partner.status === 'approved' ? 'suspended' : 'approved';

        const { error } = await supabase
            .from('partners')
            .update({ status: newStatus })
            .eq('partner_id', partner.partner_id);

        if (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث حالة الشركة",
                variant: "destructive"
            });
        } else {
            toast({
                title: newStatus === 'suspended' ? "تم إيقاف الشركة" : "تم تفعيل الشركة",
                description: newStatus === 'suspended'
                    ? `تم منع جميع موظفي "${partner.company_name}" من الدخول إلى النظام`
                    : `يمكن لموظفي "${partner.company_name}" الدخول الآن`,
            });
            fetchPartners();
        }
    };


    const filteredPartners = partners.filter(p =>
        p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p as any).manager?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExport = (type: 'excel' | 'pdf' | 'report') => {
        try {
            if (type === 'report') {
                console.log("Setting up report data for printing...");
                setReportData({
                    partners: filteredPartners,
                    company: {
                        name: 'منصه احجزلي لتقنية المعلومات',
                        logo: '/logo.png',
                        address: 'تعز, الجمهوريه اليمنيه ',
                        phone: '+967 712159295',
                        email: 'ahjazliya@gmail.com'
                    },
                    reportTitle: 'بيان بأسماء الشركاء المعتمدين',
                    generatedDate: new Date()
                });
                setShowPrintReport(true);
                return;
            }

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
        } catch (error) {
            console.error("Export error:", error);
            toast({
                title: "خطأ في التصدير",
                description: "حدث خطأ أثناء محاولة التصدير. يرجى المحاولة مرة أخرى.",
                variant: "destructive"
            });
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
            title="إدارة الشركاء والطلبات"
            subtitle="متابعة الشركات المسجلة وطلبات الانضمام الجديدة"
            actions={
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
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
                                PDF (جدول)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('report')}>
                                <FileText className="w-4 h-4 ml-2 text-primary" />
                                طباعة تقرير (A4)
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
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="partners">الشركاء المعتمدين</TabsTrigger>
                    <TabsTrigger value="applications">
                        طلبات الانضمام
                        {applications.filter(a => a.status === 'pending').length > 0 && (
                            <span className="mr-2 bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
                                {applications.filter(a => a.status === 'pending').length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="partners" className="mt-0">
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
                                                                        onClick={() => togglePartnerSuspension(partner)}
                                                                    >
                                                                        <Ban className="w-4 h-4 ml-2" /> إيقاف الشركة بالكامل
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        className="text-green-600"
                                                                        onClick={() => togglePartnerSuspension(partner)}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 ml-2" /> تفعيل الشركة
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
                </TabsContent>

                <TabsContent value="applications" className="mt-0">
                    <div className="bg-card rounded-xl border border-border p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    placeholder="بحث عن شركة أو مالك..."
                                    value={appSearchQuery}
                                    onChange={(e) => setAppSearchQuery(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {["all", "pending", "approved", "rejected"].map((status) => (
                                    <Button
                                        key={status}
                                        variant={appFilterStatus === status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setAppFilterStatus(status)}
                                    >
                                        {status === "all" && "الكل"}
                                        {status === "pending" && "قيد المراجعة"}
                                        {status === "approved" && "مقبول"}
                                        {status === "rejected" && "مرفوض"}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {appsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">الشركة</TableHead>
                                            <TableHead className="text-right">المالك</TableHead>
                                            <TableHead className="text-right">المدينة</TableHead>
                                            <TableHead className="text-right">الحالة</TableHead>
                                            <TableHead className="text-right">التاريخ</TableHead>
                                            <TableHead className="text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredApplications.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                    لا توجد طلبات مطابقة
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredApplications.map((app) => (
                                                <TableRow key={app.application_id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <Building2 className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{app.company_name}</p>
                                                                <p className="text-xs text-muted-foreground">{app.owner_email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{app.owner_name}</TableCell>
                                                    <TableCell>{app.company_city}</TableCell>
                                                    <TableCell>{getAppStatusBadge(app.status)}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground" dir="ltr">
                                                        {new Date(app.created_at).toLocaleDateString('ar-SA')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedApplication(app);
                                                                    setViewDialogOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            {app.status === "pending" && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => handleApproveApp(app)}
                                                                        className="bg-secondary hover:bg-secondary/90 h-8 w-8 p-0"
                                                                        disabled={processing}
                                                                        title="قبول"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setSelectedApplication(app);
                                                                            setRejectDialogOpen(true);
                                                                        }}
                                                                        className="h-8 w-8 p-0"
                                                                        disabled={processing}
                                                                        title="رفض"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

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
                                                                        doc.document_type}
                                                            </div>
                                                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                عرض الملف <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                            لا توجد مستندات مرفوعة
                                        </div>
                                    )}

                                    <div className="border-t pt-4 mt-6">
                                        <h3 className="text-sm font-medium mb-4">رفع مستندات جديدة</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { id: 'reg', label: 'السجل التجاري', type: 'registration', dbValue: 'registration', required: true },
                                                { id: 'tax', label: 'الشهادة الضريبية', type: 'tax', dbValue: 'tax_certificate', required: true },
                                                { id: 'auth', label: 'تفويض المدير', type: 'auth', dbValue: 'other', required: false },
                                            ].map(item => (
                                                <DocumentUploadItem key={item.id} docItem={item} partnerId={currentPartner.partner_id} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentPartner.partner_id ? "حفظ التغييرات" : "إرسال الطلب")}
                        </Button>
                    </div>
                </div>
            )}

            {/* Application View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                تفاصيل طلب الشريك
                            </DialogTitle>
                            {selectedApplication && getAppStatusBadge(selectedApplication.status || 'pending')}
                        </div>
                        <DialogDescription>
                            رقم الطلب: #{selectedApplication?.application_id} | تاريخ التقديم: {selectedApplication?.created_at && new Date(selectedApplication.created_at).toLocaleDateString('ar-EG')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApplication && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Company Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                    <Building2 className="w-5 h-5" />
                                    <h3>بيانات الشركة</h3>
                                </div>
                                <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">اسم الشركة</Label>
                                        <p className="font-medium text-base">{selectedApplication.company_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> المدينة</Label>
                                            <p className="font-medium">{selectedApplication.company_city}</p>
                                        </div>
                                        {selectedApplication.company_address && (
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">العنوان</Label>
                                                <p className="font-medium truncate" title={selectedApplication.company_address}>{selectedApplication.company_address}</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedApplication.website && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">الموقع الإلكتروني</Label>
                                            <a href={selectedApplication.website} target="_blank" rel="noreferrer" className="text-primary hover:underline block truncate">
                                                {selectedApplication.website}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Owner Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                    <User className="w-5 h-5" />
                                    <h3>بيانات المالك</h3>
                                </div>
                                <div className="grid gap-4 p-4 bg-muted/30 rounded-lg border">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">الاسم الرباعي</Label>
                                        <p className="font-medium text-base">{selectedApplication.owner_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1"><Smartphone className="w-3 h-3" /> رقم الهاتف</Label>
                                        <p className="font-medium text-lg" dir="ltr">{selectedApplication.owner_phone}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> البريد الإلكتروني</Label>
                                        <p className="font-medium">{selectedApplication.owner_email}</p>
                                    </div>
                                    {selectedApplication.owner_id_number && (
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">رقم الهوية / الجواز</Label>
                                            <p className="font-medium">{selectedApplication.owner_id_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents Section - Full Width */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                                    <Shield className="w-5 h-5" />
                                    <h3>المستندات المرفقة</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Commercial Register */}
                                    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-primary/10 rounded-full">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">السجل التجاري</h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        رقم السجل: {selectedApplication.commercial_registration || 'غير متوفر'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedApplication.commercial_register_url && (
                                                <a
                                                    href={selectedApplication.commercial_register_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> عرض
                                                </a>
                                            )}
                                        </div>
                                        {selectedApplication.commercial_register_url ? (
                                            <div className="aspect-video bg-muted rounded-md overflow-hidden relative group">
                                                <iframe
                                                    src={selectedApplication.commercial_register_url}
                                                    className="w-full h-full object-cover pointer-events-none"
                                                    title="Commercial Register Preview"
                                                />
                                                <a
                                                    href={selectedApplication.commercial_register_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="text-white font-bold flex items-center gap-2">
                                                        <ExternalLink className="w-5 h-5" /> فتح الصورة
                                                    </span>
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="h-32 flex items-center justify-center bg-muted/50 rounded-md border border-dashed text-muted-foreground text-sm">
                                                لا يوجد مرفق
                                            </div>
                                        )}
                                    </div>

                                    {/* Tax Certificate */}
                                    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-primary/10 rounded-full">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">البطاقة الضريبية</h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        الرقم الضريبي: {selectedApplication.tax_number || 'غير متوفر'}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedApplication.tax_certificate_url && (
                                                <a
                                                    href={selectedApplication.tax_certificate_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" /> عرض
                                                </a>
                                            )}
                                        </div>
                                        {selectedApplication.tax_certificate_url ? (
                                            <div className="aspect-video bg-muted rounded-md overflow-hidden relative group">
                                                <iframe
                                                    src={selectedApplication.tax_certificate_url}
                                                    className="w-full h-full object-cover pointer-events-none"
                                                    title="Tax Certificate Preview"
                                                />
                                                <a
                                                    href={selectedApplication.tax_certificate_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="text-white font-bold flex items-center gap-2">
                                                        <ExternalLink className="w-5 h-5" /> فتح الصورة
                                                    </span>
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="h-32 flex items-center justify-center bg-muted/50 rounded-md border border-dashed text-muted-foreground text-sm">
                                                لا يوجد مرفق
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex-row gap-2 justify-end pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>إغلاق</Button>
                        {selectedApplication?.status === 'pending' && (
                            <>
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => {
                                        setViewDialogOpen(false);
                                        setRejectDialogOpen(true);
                                    }}
                                >
                                    <XCircle className="w-4 h-4" />
                                    رفض الطلب
                                </Button>
                                <Button
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        setViewDialogOpen(false);
                                        handleApproveApp(selectedApplication);
                                    }}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    قبول وتفعيل
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rejection Reason Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>رفض طلب الانضمام</DialogTitle>
                        <DialogDescription>
                            يرجى توضيح سبب الرفض ليتم إرساله للعميل.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">سبب الرفض</Label>
                        <Textarea
                            placeholder="مثال: يرجى إرفاق صورة واضحة للسجل التجاري..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedApplication) handleRejectApp(selectedApplication);
                            }}
                            disabled={!rejectionReason.trim() || processing}
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد الرفض"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Partners Report View - Portaled to Body to avoid CSS issues */}
            {
                showPrintReport && reportData && createPortal(
                    <PartnersReport
                        data={reportData}
                        onClose={() => setShowPrintReport(false)}
                    />,
                    document.body
                )
            }
        </AdminLayout >
    );
};

export default PartnersManagement;



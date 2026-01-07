import { useState, useEffect } from "react";
import {
    FileText,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    XCircle,
    Loader2,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Used sonner in recent files
import AdminSidebar from "@/components/layout/AdminSidebar";

interface Policy {
    id: string;
    title: string;
    content: string;
    type: 'internal' | 'public' | 'terms' | 'privacy';
    status: 'active' | 'draft' | 'archived';
    version: string;
    updated_at: string;
}

const PolicyManagement = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentPolicy, setCurrentPolicy] = useState<Partial<Policy>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('policies')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching policies:', error);
            toast.error("فشل في تحميل السياسات");
        } else {
            setPolicies(data as Policy[] || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentPolicy.title || !currentPolicy.content) {
            toast.error("يرجى ملء جميع الحقول المطلوبة");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title: currentPolicy.title,
                content: currentPolicy.content,
                type: currentPolicy.type || 'internal',
                status: currentPolicy.status || 'draft',
                version: currentPolicy.version || '1.0'
            };

            let error;
            if (currentPolicy.id) {
                // Update
                const res = await supabase
                    .from('policies')
                    .update(payload)
                    .eq('id', currentPolicy.id);
                error = res.error;
            } else {
                // Insert
                const res = await supabase
                    .from('policies')
                    .insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            toast.success(currentPolicy.id ? "تم تحديث السياسة بنجاح" : "تم إنشاء السياسة بنجاح");
            setIsEditorOpen(false);
            fetchPolicies();
        } catch (error: any) {
            console.error('Error saving policy:', error);
            toast.error("فشل في حفظ السياسة");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه السياسة؟")) return;

        const { error } = await supabase
            .from('policies')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("فشل في حذف السياسة");
        } else {
            toast.success("تم حذف السياسة بنجاح");
            fetchPolicies();
        }

    };

    const openEditor = (policy?: Policy) => {
        if (policy) {
            setCurrentPolicy({ ...policy });
        } else {
            setCurrentPolicy({
                title: "",
                content: "",
                type: 'internal',
                status: 'draft',
                version: '1.0'
            });
        }
        setIsEditorOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> فعال</span>;
            case 'draft':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Edit className="w-3 h-3" /> مسودة</span>;
            case 'archived':
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="w-3 h-3" /> مؤرشف</span>;
            default:
                return status;
        }
    };

    const getTypeLabel = (type: string) => {
        const types: any = {
            'internal': 'داخلي',
            'public': 'عام',
            'terms': 'شروط وأحكام',
            'privacy': 'سياسة خصوصية'
        };
        return types[type] || type;
    };

    const filteredPolicies = policies.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">إدارة السياسات</h1>
                        <p className="text-muted-foreground">صياغة ونشر سياسات الشركة والشروط والأحكام</p>
                    </div>
                    <Button onClick={() => openEditor()}>
                        <Plus className="w-4 h-4 ml-2" />
                        سياسة جديدة
                    </Button>
                </header>

                <div className="flex items-center gap-2 mb-6 bg-card p-2 rounded-lg border w-fit">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في السياسات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none shadow-none focus-visible:ring-0 w-64 h-8"
                    />
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">العنوان</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">الإصدار</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">تاريخ التحديث</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPolicies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            لا توجد سياسات مضافة
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPolicies.map((policy) => (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    {policy.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getTypeLabel(policy.type)}</TableCell>
                                            <TableCell>{policy.version}</TableCell>
                                            <TableCell>{getStatusBadge(policy.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground text-left" dir="ltr">
                                                {new Date(policy.updated_at).toLocaleDateString('ar-SA')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditor(policy)}>
                                                            <Edit className="w-4 h-4 ml-2" /> تعديل
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(policy.id)}>
                                                            <Trash2 className="w-4 h-4 ml-2" /> حذف
                                                        </DropdownMenuItem>
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

                {/* Policy Editor Dialog */}
                <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{currentPolicy.id ? "تعديل السياسة" : "إضافة سياسة جديدة"}</DialogTitle>
                            <DialogDescription>
                                قم بإدخال تفاصيل السياسة ومحتواها أدناه
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>عنوان السياسة</Label>
                                    <Input
                                        value={currentPolicy.title || ""}
                                        onChange={(e) => setCurrentPolicy({ ...currentPolicy, title: e.target.value })}
                                        placeholder="مثال: سياسة الخصوصية"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>الإصدار</Label>
                                    <Input
                                        value={currentPolicy.version || "1.0"}
                                        onChange={(e) => setCurrentPolicy({ ...currentPolicy, version: e.target.value })}
                                        placeholder="1.0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>النوع</Label>
                                    <Select
                                        value={currentPolicy.type}
                                        onValueChange={(val: any) => setCurrentPolicy({ ...currentPolicy, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="internal">داخلي</SelectItem>
                                            <SelectItem value="public">عام</SelectItem>
                                            <SelectItem value="terms">شروط وأحكام</SelectItem>
                                            <SelectItem value="privacy">سياسة خصوصية</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>الحالة</Label>
                                    <Select
                                        value={currentPolicy.status}
                                        onValueChange={(val: any) => setCurrentPolicy({ ...currentPolicy, status: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر الحالة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">مسودة</SelectItem>
                                            <SelectItem value="active">فعال</SelectItem>
                                            <SelectItem value="archived">مؤرشف</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>المحتوى</Label>
                                <Textarea
                                    value={currentPolicy.content || ""}
                                    onChange={(e) => setCurrentPolicy({ ...currentPolicy, content: e.target.value })}
                                    placeholder="اكتب نص السياسة هنا..."
                                    className="min-h-[300px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>إلغاء</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                حفظ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default PolicyManagement;

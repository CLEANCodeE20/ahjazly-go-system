import { useState, useEffect } from "react";
import {
    HelpCircle,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
    GripVertical
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface FAQ {
    faq_id: number;
    category: string;
    question: string;
    answer: string;
    display_order: number;
    is_active: boolean;
    updated_at: string;
}

const FAQManager = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentFaq, setCurrentFaq] = useState<Partial<FAQ>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('faqs')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching FAQs:', error);
            toast.error("فشل في تحميل الأسئلة الشائعة");
        } else {
            setFaqs(data as FAQ[] || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentFaq.question || !currentFaq.answer) {
            toast.error("يرجى ملء كافة الحقول");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                category: currentFaq.category || 'عام',
                question: currentFaq.question,
                answer: currentFaq.answer,
                display_order: currentFaq.display_order || 0,
                is_active: currentFaq.is_active ?? true
            };

            let error;
            if (currentFaq.faq_id) {
                const res = await supabase
                    .from('faqs')
                    .update(payload)
                    .eq('faq_id', currentFaq.faq_id);
                error = res.error;
            } else {
                const res = await supabase
                    .from('faqs')
                    .insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            toast.success("تم الحفظ بنجاح");
            setIsEditorOpen(false);
            fetchFaqs();
        } catch (error: any) {
            toast.error("فشل في الحفظ");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من الحذف؟")) return;

        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('faq_id', id);

        if (error) {
            toast.error("فشل في الحذف");
        } else {
            toast.success("تم الحذف بنجاح");
            fetchFaqs();
        }
    };

    const openEditor = (faq?: FAQ) => {
        if (faq) {
            setCurrentFaq({ ...faq });
        } else {
            setCurrentFaq({
                category: 'عام',
                question: "",
                answer: "",
                display_order: faqs.length,
                is_active: true
            });
        }
        setIsEditorOpen(true);
    };

    const filteredFaqs = faqs.filter(f =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">إدارة الأسئلة الشائعة</h1>
                        <p className="text-muted-foreground">التحكم في محتوى قسم المساعدة لركاب التطبيق</p>
                    </div>
                    <Button onClick={() => openEditor()}>
                        <Plus className="w-4 h-4 ml-2" />
                        سؤال جديد
                    </Button>
                </header>

                <div className="flex items-center gap-2 mb-6 bg-card p-2 rounded-lg border w-fit">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في الأسئلة..."
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
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead className="text-right">التصنيف</TableHead>
                                    <TableHead className="text-right">السؤال</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">الإرشادات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFaqs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            لا توجد أسئلة مضافة حالياً
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFaqs.map((faq) => (
                                        <TableRow key={faq.faq_id}>
                                            <TableCell><GripVertical className="w-4 h-4 text-muted-foreground/30" /></TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-muted rounded text-xs">{faq.category}</span>
                                            </TableCell>
                                            <TableCell className="font-medium max-w-sm truncate">{faq.question}</TableCell>
                                            <TableCell>
                                                {faq.is_active ? (
                                                    <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> نشط</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> معطل</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditor(faq)}>
                                                            <Edit className="w-4 h-4 ml-2" /> تعديل
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(faq.faq_id)}>
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

                <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{currentFaq.faq_id ? "تعديل السؤال" : "إضافة سؤال جديد"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>التصنيف</Label>
                                    <Input
                                        value={currentFaq.category || ""}
                                        onChange={(e) => setCurrentFaq({ ...currentFaq, category: e.target.value })}
                                        placeholder="مثال: الحجوزات، الدفع..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ترتيب العرض</Label>
                                    <Input
                                        type="number"
                                        value={currentFaq.display_order ?? 0}
                                        onChange={(e) => setCurrentFaq({ ...currentFaq, display_order: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>السؤال</Label>
                                <Input
                                    value={currentFaq.question || ""}
                                    onChange={(e) => setCurrentFaq({ ...currentFaq, question: e.target.value })}
                                    placeholder="اكتب السؤال هنا..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>الإجابة</Label>
                                <Textarea
                                    value={currentFaq.answer || ""}
                                    onChange={(e) => setCurrentFaq({ ...currentFaq, answer: e.target.value })}
                                    placeholder="اكتب الإجابة التفصيلية هنا..."
                                    className="min-h-[150px]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={currentFaq.is_active ?? true}
                                    onCheckedChange={(val) => setCurrentFaq({ ...currentFaq, is_active: val })}
                                />
                                <Label>تفعيل السؤال (يظهر للمستخدمين)</Label>
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

export default FAQManager;

import { useState } from "react";
import {
    Shield,
    Plus,
    Edit,
    Trash2,
    Clock,
    Percent,
    DollarSign,
    Save,
    X,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePartner } from "@/hooks/usePartner";
import {
    useCancellationPolicies,
    useCancellationPolicyRules,
    useCreateCancellationPolicy,
    useUpdateCancellationPolicy,
    useDeleteCancellationPolicy,
    useUpsertCancellationRule,
    useDeleteCancellationRule,
    CancelPolicy,
    CancelPolicyRule
} from "@/hooks/useCancellationPolicies";

const CancellationPolicies = () => {
    const { partner } = usePartner();
    const partnerId = partner?.partner_id;

    const { data: policies = [], isLoading: loadingPolicies } = useCancellationPolicies(partnerId);
    const createPolicy = useCreateCancellationPolicy();
    const updatePolicy = useUpdateCancellationPolicy();
    const deletePolicy = useDeleteCancellationPolicy();

    const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Partial<CancelPolicy> | null>(null);
    const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);

    const { data: rules = [], isLoading: loadingRules } = useCancellationPolicyRules(selectedPolicyId || undefined);
    const upsertRule = useUpsertCancellationRule();
    const deleteRule = useDeleteCancellationRule();

    const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<CancelPolicyRule> | null>(null);

    const handleSavePolicy = async () => {
        if (!partnerId) return;
        try {
            if (editingPolicy?.cancel_policy_id) {
                await updatePolicy.mutateAsync({
                    id: editingPolicy.cancel_policy_id,
                    ...editingPolicy
                });
            } else {
                await createPolicy.mutateAsync({
                    ...editingPolicy,
                    partner_id: partnerId,
                    is_active: true
                });
            }
            setIsPolicyDialogOpen(false);
            setEditingPolicy(null);
        } catch (error) {
            console.error("Error saving policy:", error);
        }
    };

    const handleSaveRule = async () => {
        if (!selectedPolicyId) return;
        try {
            await upsertRule.mutateAsync({
                ...editingRule,
                cancel_policy_id: selectedPolicyId
            });
            setIsRuleDialogOpen(false);
            setEditingRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
        }
    };

    return (
        <DashboardLayout
            subtitle="إدارة سياسات الإلغاء والاسترداد الخاصة بشركتك"
            actions={
                <Button onClick={() => {
                    setEditingPolicy({});
                    setIsPolicyDialogOpen(true);
                }}>
                    <Plus className="w-4 h-4 ml-2" />
                    سياسة جديدة
                </Button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
                {/* Policies List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            السياسات
                        </h3>
                    </div>
                    {loadingPolicies ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : policies.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="py-10 text-center text-muted-foreground">
                                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">لا توجد سياسات حالياً</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {policies.map((policy) => (
                                <Card
                                    key={policy.cancel_policy_id}
                                    className={`group cursor-pointer transition-all duration-300 hover:shadow-elegant overflow-hidden ${selectedPolicyId === policy.cancel_policy_id
                                        ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-elegant"
                                        : "hover:border-primary/30"
                                        }`}
                                    onClick={() => setSelectedPolicyId(policy.cancel_policy_id)}
                                >
                                    <div className={`h-1 w-full ${policy.is_active ? 'bg-primary/40' : 'bg-muted'}`} />
                                    <CardHeader className="p-4 space-y-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <CardTitle className="text-sm font-bold truncate leading-tight">
                                                        {policy.policy_name}
                                                    </CardTitle>
                                                    {policy.is_default && (
                                                        <span className="shrink-0 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black uppercase">Default</span>
                                                    )}
                                                </div>
                                                <CardDescription className="line-clamp-1 text-[11px]">
                                                    {policy.description || "لا يوجد وصف لهذه السياسة"}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingPolicy(policy);
                                                        setIsPolicyDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("هل أنت متأكد من حذف هذه السياسة؟")) {
                                                            deletePolicy.mutate({ id: policy.cancel_policy_id, partnerId: partnerId! });
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rules Details */}
                <div className="lg:col-span-3">
                    {!selectedPolicyId ? (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-card/40 backdrop-blur rounded-2xl border border-dashed border-border/50 text-muted-foreground">
                            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                <Shield className="w-10 h-10 opacity-20" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground mb-1">إختر سياسة للبدء</h4>
                            <p className="text-sm max-w-[300px] text-center">قم باختيار إحدى السياسات من القائمة اليمنى لعرض وتعديل قواعد الاسترداد الخاصة بها</p>
                        </div>
                    ) : (
                        <Card className="border-none shadow-elegant bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl">
                            <CardHeader className="border-b border-border/50 bg-muted/10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold">
                                                {policies.find(p => p.cancel_policy_id === selectedPolicyId)?.policy_name}
                                            </CardTitle>
                                            <CardDescription className="text-xs">إدارة قواعد وقيم الاسترداد حسب الوقت</CardDescription>
                                        </div>
                                    </div>
                                    <Button onClick={() => {
                                        setEditingRule({ display_order: rules.length + 1, is_active: true });
                                        setIsRuleDialogOpen(true);
                                    }} className="gradient-primary">
                                        <Plus className="w-4 h-4 ml-2" />
                                        إضافة قاعدة جديدة
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loadingRules ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="hover:bg-transparent border-border/50">
                                                    <TableHead className="text-right p-4 font-bold text-xs">الوقت المتبقي للرحلة (بالساعات)</TableHead>
                                                    <TableHead className="text-right p-4 font-bold text-xs">نسبة الاسترداد</TableHead>
                                                    <TableHead className="text-right p-4 font-bold text-xs">رسوم ثابتة (ريال)</TableHead>
                                                    <TableHead className="text-left p-4 font-bold text-xs">الإجراءات</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rules.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-20">
                                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                                <Clock className="w-10 h-10 opacity-10" />
                                                                <p className="text-sm font-medium">لا توجد قواعد لهذه السياسة حالياً</p>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingRule({ display_order: 1, is_active: true });
                                                                        setIsRuleDialogOpen(true);
                                                                    }}
                                                                >
                                                                    أضف أول قاعدة الآن
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    rules.map((rule, idx) => (
                                                        <TableRow key={rule.rule_id} className="border-border/40 hover:bg-muted/20 transition-colors group">
                                                            <TableCell className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <span className="font-medium">
                                                                        {rule.min_hours_before_departure && rule.max_hours_before_departure
                                                                            ? `من ${rule.min_hours_before_departure} إلى ${rule.max_hours_before_departure} ساعة`
                                                                            : rule.min_hours_before_departure
                                                                                ? `أكثر من ${rule.min_hours_before_departure} ساعة`
                                                                                : `أقل من ${rule.max_hours_before_departure} ساعة`}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="p-4">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${rule.refund_percentage > 50 ? 'bg-green-100 text-green-700' : rule.refund_percentage > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {rule.refund_percentage}%
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="p-4">
                                                                <span className="text-foreground/80 font-mono">{rule.cancellation_fee}</span>
                                                            </TableCell>
                                                            <TableCell className="p-4">
                                                                <div className="flex gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => {
                                                                        setEditingRule(rule);
                                                                        setIsRuleDialogOpen(true);
                                                                    }}>
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => {
                                                                        if (confirm("هل أنت متأكد من حذف هذه القاعدة؟")) {
                                                                            deleteRule.mutate({ id: rule.rule_id, policyId: selectedPolicyId });
                                                                        }
                                                                    }}>
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Policy Dialog */}
            <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {editingPolicy?.cancel_policy_id ? "تعديل السياسة" : "إنشاء سياسة جديدة"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="policy_name" className="text-sm font-semibold">اسم السياسة *</Label>
                            <Input
                                id="policy_name"
                                value={editingPolicy?.policy_name || ""}
                                onChange={(e) => setEditingPolicy({ ...editingPolicy, policy_name: e.target.value })}
                                placeholder="مثلاً: السياسة العادية، سياسة الأعياد..."
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-semibold">الوصف</Label>
                            <Textarea
                                id="description"
                                value={editingPolicy?.description || ""}
                                onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                                placeholder="اشرح تفاصيل السياسة للمسافرين..."
                                className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[100px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-sm font-semibold">الأولوية</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    value={editingPolicy?.priority || 0}
                                    onChange={(e) => setEditingPolicy({ ...editingPolicy, priority: Number(e.target.value) })}
                                    className="bg-background/50 border-border/50 focus:border-primary/50"
                                />
                                <p className="text-[10px] text-muted-foreground">قيم أعلى تظهر أولاً</ p>
                            </div>
                            <div className="flex flex-col justify-center gap-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">حالة النشاط</Label>
                                    <Switch
                                        checked={editingPolicy?.is_active ?? true}
                                        onCheckedChange={(checked) => setEditingPolicy({ ...editingPolicy, is_active: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold">افتراضية</Label>
                                    </div>
                                    <Switch
                                        checked={editingPolicy?.is_default || false}
                                        onCheckedChange={(checked) => setEditingPolicy({ ...editingPolicy, is_default: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsPolicyDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSavePolicy} className="gradient-primary" disabled={updatePolicy.isPending || createPolicy.isPending}>
                            {(updatePolicy.isPending || createPolicy.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            <Save className="w-4 h-4 ml-2" />
                            حفظ السياسة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rule Dialog */}
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-xl border-border" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            {editingRule?.rule_id ? "تعديل القاعدة" : "إضافة قاعدة جديدة"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-5">
                        <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">النطاق الزمني (ساعات قبل الرحلة)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min_hours" className="text-xs">الحد الأدنى</Label>
                                    <Input
                                        id="min_hours"
                                        type="number"
                                        value={editingRule?.min_hours_before_departure || ""}
                                        onChange={(e) => setEditingRule({ ...editingRule, min_hours_before_departure: Number(e.target.value) })}
                                        className="bg-background border-border/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_hours" className="text-xs">الحد الأقصى</Label>
                                    <Input
                                        id="max_hours"
                                        type="number"
                                        value={editingRule?.max_hours_before_departure || ""}
                                        onChange={(e) => setEditingRule({ ...editingRule, max_hours_before_departure: Number(e.target.value) })}
                                        className="bg-background border-border/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="refund_percent" className="text-sm font-semibold">نسبة الاسترداد</Label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="refund_percent"
                                        type="number"
                                        className="pl-9 bg-background/50"
                                        value={editingRule?.refund_percentage ?? ""}
                                        onChange={(e) => setEditingRule({ ...editingRule, refund_percentage: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cancel_fee" className="text-sm font-semibold">رسوم الإلغاء ثابتة</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="cancel_fee"
                                        type="number"
                                        className="pl-9 bg-background/50"
                                        value={editingRule?.cancellation_fee ?? 0}
                                        onChange={(e) => setEditingRule({ ...editingRule, cancellation_fee: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsRuleDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSaveRule} className="gradient-primary flex-1" disabled={upsertRule.isPending}>
                            {upsertRule.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            <Save className="w-4 h-4 ml-2" />
                            حفظ القاعدة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CancellationPolicies;

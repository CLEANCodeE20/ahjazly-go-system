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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Policies List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        السياسات المتاحة
                    </h3>
                    {loadingPolicies ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : policies.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                لا توجد سياسات حالياً
                            </CardContent>
                        </Card>
                    ) : (
                        policies.map((policy) => (
                            <Card
                                key={policy.cancel_policy_id}
                                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedPolicyId === policy.cancel_policy_id ? "border-primary ring-1 ring-primary/20" : ""
                                    }`}
                                onClick={() => setSelectedPolicyId(policy.cancel_policy_id)}
                            >
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base">{policy.policy_name}</CardTitle>
                                            {policy.is_default && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">افتراضية</span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPolicy(policy);
                                                setIsPolicyDialogOpen(true);
                                            }}>
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("هل أنت متأكد من حذف هذه السياسة؟")) {
                                                    deletePolicy.mutate({ id: policy.cancel_policy_id, partnerId: partnerId! });
                                                }
                                            }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardDescription className="line-clamp-2 text-xs mt-1">
                                        {policy.description || "لا يوجد وصف"}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))
                    )}
                </div>

                {/* Rules for Selected Policy */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            قواعد الاسترداد
                        </h3>
                        {selectedPolicyId && (
                            <Button variant="outline" size="sm" onClick={() => {
                                setEditingRule({ display_order: rules.length + 1, is_active: true });
                                setIsRuleDialogOpen(true);
                            }}>
                                <Plus className="w-4 h-4 ml-2" />
                                إضافة قاعدة
                            </Button>
                        )}
                    </div>

                    {!selectedPolicyId ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-muted/30 rounded-xl border border-dashed text-muted-foreground">
                            <Shield className="w-12 h-12 mb-2 opacity-10" />
                            <p>اختر سياسة من القائمة لعرض قواعدها</p>
                        </div>
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            {loadingRules ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">قبل المغادرة (ساعة)</TableHead>
                                            <TableHead className="text-right">نسبة الاسترداد</TableHead>
                                            <TableHead className="text-right">رسوم الإلغاء</TableHead>
                                            <TableHead className="text-right">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rules.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                                    لا توجد قواعد لهذه السياسة بعد
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rules.map((rule) => (
                                                <TableRow key={rule.rule_id}>
                                                    <TableCell>
                                                        {rule.min_hours_before_departure && rule.max_hours_before_departure
                                                            ? `بين ${rule.min_hours_before_departure} و ${rule.max_hours_before_departure}`
                                                            : rule.min_hours_before_departure
                                                                ? `أكثر من ${rule.min_hours_before_departure}`
                                                                : `أقل من ${rule.max_hours_before_departure}`}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-green-600">
                                                        {rule.refund_percentage}%
                                                    </TableCell>
                                                    <TableCell>{rule.cancellation_fee} ريال</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                setEditingRule(rule);
                                                                setIsRuleDialogOpen(true);
                                                            }}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                                                                if (confirm("هل أنت متأكد من حذف هذه القاعدة؟")) {
                                                                    deleteRule.mutate({ id: rule.rule_id, policyId: selectedPolicyId });
                                                                }
                                                            }}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Policy Dialog */}
            <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{editingPolicy?.cancel_policy_id ? "تعديل السياسة" : "إنشاء سياسة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="policy_name">اسم السياسة</Label>
                            <Input
                                id="policy_name"
                                value={editingPolicy?.policy_name || ""}
                                onChange={(e) => setEditingPolicy({ ...editingPolicy, policy_name: e.target.value })}
                                placeholder="مثلاً: السياسة العادية"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">الوصف</Label>
                            <Textarea
                                id="description"
                                value={editingPolicy?.description || ""}
                                onChange={(e) => setEditingPolicy({ ...editingPolicy, description: e.target.value })}
                                placeholder="اشرح تفاصيل السياسة للمسافرين..."
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>سياسة افتراضية</Label>
                                <p className="text-xs text-muted-foreground">تطبق تلقائياً على الرحلات الجديدة</p>
                            </div>
                            <Switch
                                checked={editingPolicy?.is_default || false}
                                onCheckedChange={(checked) => setEditingPolicy({ ...editingPolicy, is_default: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPolicyDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSavePolicy} disabled={updatePolicy.isPending || createPolicy.isPending}>
                            {(updatePolicy.isPending || createPolicy.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            حفظ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rule Dialog */}
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                <DialogContent className="sm:max-w-[400px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{editingRule?.rule_id ? "تعديل القاعدة" : "إضافة قاعدة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_hours">الحد الأدنى (ساعة)</Label>
                                <Input
                                    id="min_hours"
                                    type="number"
                                    value={editingRule?.min_hours_before_departure || ""}
                                    onChange={(e) => setEditingRule({ ...editingRule, min_hours_before_departure: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_hours">الحد الأقصى (ساعة)</Label>
                                <Input
                                    id="max_hours"
                                    type="number"
                                    value={editingRule?.max_hours_before_departure || ""}
                                    onChange={(e) => setEditingRule({ ...editingRule, max_hours_before_departure: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refund_percent">نسبة الاسترداد (%)</Label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="refund_percent"
                                    type="number"
                                    className="pl-9"
                                    value={editingRule?.refund_percentage || ""}
                                    onChange={(e) => setEditingRule({ ...editingRule, refund_percentage: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cancel_fee">رسوم الإلغاء (ريال)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="cancel_fee"
                                    type="number"
                                    className="pl-9"
                                    value={editingRule?.cancellation_fee || ""}
                                    onChange={(e) => setEditingRule({ ...editingRule, cancellation_fee: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSaveRule} disabled={upsertRule.isPending}>
                            {upsertRule.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            حفظ القاعدة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default CancellationPolicies;

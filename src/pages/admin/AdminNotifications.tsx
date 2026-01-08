import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Users, Building2, Megaphone, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const AdminNotifications = () => {
    const [isSending, setIsSending] = useState(false);
    const [targetType, setTargetType] = useState<"all" | "partners" | "specific_partner" | "specific_user">("all");
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        target_id: "",
        priority: "medium",
        type: "system",
        action_url: "",
    });

    const { data: partners = [] } = useQuery({
        queryKey: ["partners-list"],
        queryFn: async () => {
            const { data, error } = await supabase.from("partners").select("partner_id, company_name");
            if (error) throw error;
            return data;
        },
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            let targetUsers: any[] = [];

            if (targetType === "all") {
                const { data } = await supabase.from("users").select("user_id");
                targetUsers = data || [];
            } else if (targetType === "partners") {
                const { data } = await supabase.from("users").select("user_id").eq("user_type", "partner");
                targetUsers = data || [];
            } else if (targetType === "specific_partner") {
                const { data } = await supabase.from("users").select("user_id").eq("partner_id", parseInt(formData.target_id));
                targetUsers = data || [];
            } else if (targetType === "specific_user") {
                targetUsers = [{ user_id: parseInt(formData.target_id) }];
            }

            const notificationsToInsert = targetUsers.map(u => ({
                user_id: u.user_id,
                title: formData.title,
                message: formData.message,
                type: formData.type as any,
                priority: formData.priority,
                action_url: formData.action_url,
                partner_id: targetType === "specific_partner" ? parseInt(formData.target_id) : null,
            }));

            const { error } = await supabase.from("notifications").insert(notificationsToInsert as any);

            if (error) throw error;

            toast.success("تم إرسال الإشعارات بنجاح");
            setFormData({
                title: "",
                message: "",
                target_id: "",
                priority: "medium",
                type: "system",
                action_url: "",
            });
        } catch (error: any) {
            toast.error("فشل إرسال الإشعارات: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AdminLayout
            title="إدارة الإشعارات"
            subtitle="إرسال إشعارات للنظام أو لشركاء محددين"
        >
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary" />
                            إرسال إشعار جديد
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSend} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>الفئة المستهدفة</Label>
                                    <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">جميع المستخدمين</SelectItem>
                                            <SelectItem value="partners">جميع الشركاء</SelectItem>
                                            <SelectItem value="specific_partner">شركة محددة</SelectItem>
                                            <SelectItem value="specific_user">مستخدم محدد</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {targetType === "specific_partner" && (
                                    <div className="space-y-2">
                                        <Label>اختر الشركة</Label>
                                        <Select
                                            value={formData.target_id}
                                            onValueChange={(v) => setFormData({ ...formData, target_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر شركة..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {partners.map(p => (
                                                    <SelectItem key={p.partner_id} value={p.partner_id.toString()}>
                                                        {p.company_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {targetType === "specific_user" && (
                                    <div className="space-y-2">
                                        <Label>معرف المستخدم (User ID)</Label>
                                        <Input
                                            value={formData.target_id}
                                            onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                                            placeholder="أدخل ID المستخدم..."
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>الأولوية</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(v) => setFormData({ ...formData, priority: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">منخفضة</SelectItem>
                                            <SelectItem value="medium">متوسطة</SelectItem>
                                            <SelectItem value="high">عالية</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>عنوان الإشعار</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="عنوان جذاب للإشعار..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>نص الرسالة</Label>
                                <Textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="اكتب محتوى الإشعار هنا..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>رابط الإجراء (اختياري)</Label>
                                <Input
                                    value={formData.action_url}
                                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                                    placeholder="/admin/bookings or https://..."
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSending}>
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                        جاري الإرسال...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 ml-2" />
                                        إرسال الإشعار الآن
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                                    <h3 className="text-2xl font-bold">--</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-full">
                                    <Building2 className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">الشركاء النشطون</p>
                                    <h3 className="text-2xl font-bold">{partners.length}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/10 rounded-full">
                                    <Megaphone className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">إشعارات اليوم</p>
                                    <h3 className="text-2xl font-bold">--</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

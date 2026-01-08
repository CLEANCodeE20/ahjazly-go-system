import { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Bell,
    Shield,
    DollarSign,
    Languages,
    Loader2,
    Database,
    Download,
    History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useUISiteSettings, useUpdateSiteSetting } from "@/hooks/useSDUI";
import { BackupService } from "@/lib/services/BackupService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PlatformSettings = () => {
    const { data: siteSettings = [], isLoading: fetchingSettings } = useUISiteSettings();
    const updateSetting = useUpdateSiteSetting();
    const [loading, setLoading] = useState(false);

    const [settings, setSettings] = useState({
        default_commission: "10",
        maintenance_mode: false,
        allow_new_registrations: true,
        notify_on_new_application: true,
        platform_name: "احجزلي لخدمات النقل",
        support_email: "support@ahjazly.com"
    });

    useEffect(() => {
        if (siteSettings.length > 0) {
            const newSettings = { ...settings };
            siteSettings.forEach(s => {
                switch (s.setting_key) {
                    case 'maintenance_mode':
                        newSettings.maintenance_mode = s.setting_value === 'true';
                        break;
                    case 'site_name':
                        newSettings.platform_name = s.setting_value || "";
                        break;
                    case 'contact_email':
                        newSettings.support_email = s.setting_value || "";
                        break;
                    case 'allow_new_registrations':
                        newSettings.allow_new_registrations = s.setting_value === 'true';
                        break;
                    case 'notify_on_new_application':
                        newSettings.notify_on_new_application = s.setting_value === 'true';
                        break;
                    case 'default_commission':
                        newSettings.default_commission = s.setting_value || "10";
                        break;
                }
            });
            setSettings(newSettings);
        }
    }, [siteSettings]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update settings one by one
            await Promise.all([
                updateSetting.mutateAsync({ key: 'maintenance_mode', value: settings.maintenance_mode.toString() }),
                updateSetting.mutateAsync({ key: 'site_name', value: settings.platform_name }),
                updateSetting.mutateAsync({ key: 'contact_email', value: settings.support_email }),
                updateSetting.mutateAsync({ key: 'allow_new_registrations', value: settings.allow_new_registrations.toString() }),
                updateSetting.mutateAsync({ key: 'notify_on_new_application', value: settings.notify_on_new_application.toString() }),
                updateSetting.mutateAsync({ key: 'default_commission', value: settings.default_commission }),
            ]);

            toast({
                title: "تم الحفظ",
                description: "تم تحديث إعدادات المنصة بنجاح",
            });
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingSettings) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AdminLayout
            title="إعدادات المنصة"
            subtitle="إدارة الإعدادات العامة للنظام"
            actions={
                <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
                    {loading ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 ml-2" />
                    )}
                    حفظ الإعدادات
                </Button>
            }
        >
            <div className="grid gap-6 max-w-4xl">
                {/* General Settings */}
                <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        الإعدادات العامة
                    </h2>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="platform_name">اسم المنصة</Label>
                            <Input
                                id="platform_name"
                                value={settings.platform_name}
                                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="support_email">بريد الدعم الفني</Label>
                            <Input
                                id="support_email"
                                value={settings.support_email}
                                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                {/* Financial Settings */}
                <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        الإعدادات المالية
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="default_commission">نسبة العمولة الافتراضية للشركاء (%)</Label>
                            <Input
                                id="default_commission"
                                type="number"
                                value={settings.default_commission}
                                onChange={(e) => setSettings({ ...settings, default_commission: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                {/* System Status */}
                <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        حالة النظام
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">وضع الصيانة</p>
                                <p className="text-sm text-muted-foreground">إيقاف المنصة مؤقتاً لجميع المستخدمين عدا المسؤولين</p>
                            </div>
                            <Switch
                                checked={settings.maintenance_mode}
                                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">تفعيل تسجيل الشركاء</p>
                                <p className="text-sm text-muted-foreground">السماح لشركات النقل الجديدة بتقديم طلبات انضمام</p>
                            </div>
                            <Switch
                                checked={settings.allow_new_registrations}
                                onCheckedChange={(checked) => setSettings({ ...settings, allow_new_registrations: checked })}
                            />
                        </div>
                    </div>
                </section>

                {/* Backup & Security Management */}
                <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        إدارة النسخ الاحتياطي والأمان
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <div>
                                <h3 className="font-medium flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    نسخ احتياطي يدوي
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">تنزيل نسخة كاملة من بيانات النظام بصيغة Excel (تعدد الصفحات)</p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => BackupService.exportFullDatabase()}
                            >
                                تصدير قاعدة البيانات بالكامل
                            </Button>
                        </div>

                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                            <div>
                                <h3 className="font-medium flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    سجل العمليات (Audit Logs)
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">تصدير سجل التغييرات الأخير بصيغة JSON للتحليل الدقيق</p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => BackupService.exportTableAsJSON('audit_logs')}
                            >
                                تصدير السجل كـ JSON
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">النسخ الاحتياطي الآلي</p>
                                <p className="text-xs text-muted-foreground">النظام يقوم حالياً بعمل نسخ احتياطي دوري لقاعدة البيانات عبر سوبابيس بشكل تلقائي.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notification Settings */}
                <section className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        إعدادات الإشعارات
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">تنبيهات الطلبات الجديدة</p>
                            <p className="text-sm text-muted-foreground">إرسال بريد إلكتروني للمسؤولين عند وصول طلب انضمام جديد</p>
                        </div>
                        <Switch
                            checked={settings.notify_on_new_application}
                            onCheckedChange={(checked) => setSettings({ ...settings, notify_on_new_application: checked })}
                        />
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
};
export default PlatformSettings;



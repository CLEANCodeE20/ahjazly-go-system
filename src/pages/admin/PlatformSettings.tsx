import { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Bell,
    Shield,
    DollarSign,
    Languages,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useUISiteSettings, useUpdateSiteSetting } from "@/hooks/useSDUI";

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
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">إعدادات المنصة</h1>
                    <p className="text-muted-foreground">إدارة الإعدادات العامة للنظام</p>
                </header>

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

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={loading} className="w-48">
                            {loading ? (
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 ml-2" />
                            )}
                            حفظ الإعدادات
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlatformSettings;

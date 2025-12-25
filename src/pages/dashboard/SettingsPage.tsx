import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Bus,
  Building2,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  Upload,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePartner } from "@/hooks/usePartner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const SettingsPage = () => {
  const { toast } = useToast();
  const { partner, partnerId, isLoading: partnerLoading } = usePartner();
  const [activeTab, setActiveTab] = useState("company");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [companyData, setCompanyData] = useState({
    company_name: "",
    contact_person: "",
    address: "",
    commission_percentage: 10
  });

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailPayments: true,
    emailReports: false,
    smsBookings: true,
    smsPayments: false,
    pushNotifications: true
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    language: "ar",
    theme: "light",
    calendar: "hijri"
  });

  useEffect(() => {
    if (partner) {
      setCompanyData({
        company_name: partner.company_name || "",
        contact_person: partner.contact_person || "",
        address: partner.address || "",
        commission_percentage: partner.commission_percentage || 10
      });

      if (partner.settings) {
        if (partner.settings.notifications) {
          setNotifications(prev => ({ ...prev, ...partner.settings.notifications }));
        }
        if (partner.settings.appearance) {
          setAppearanceSettings(prev => ({ ...prev, ...partner.settings.appearance }));
        }
      }
    }
  }, [partner]);

  const handleSaveCompany = async () => {
    if (!partnerId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          company_name: companyData.company_name,
          contact_person: companyData.contact_person,
          address: companyData.address
        })
        .eq('partner_id', partnerId);

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ بيانات الشركة بنجاح"
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!partnerId || !partner) return;
    setIsSaving(true);
    try {
      const newSettings = {
        ...(partner.settings || {}),
        notifications
      };

      const { error } = await supabase
        .from('partners')
        .update({ settings: newSettings })
        .eq('partner_id', partnerId);

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الإشعارات بنجاح"
      });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حفظ الإشعارات", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    if (!partnerId || !partner) return;
    setIsSaving(true);
    try {
      const newSettings = {
        ...(partner.settings || {}),
        appearance: appearanceSettings
      };

      const { error } = await supabase
        .from('partners')
        .update({ settings: newSettings })
        .eq('partner_id', partnerId);

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات المظهر بنجاح"
      });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل حفظ المظهر", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !partnerId) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `partners/${partnerId}/logo.${fileExt}`;

    setIsSaving(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('partner-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('partners')
        .update({ logo_url: publicUrl })
        .eq('partner_id', partnerId);

      if (updateError) throw updateError;

      toast({ title: "تم الرفع", description: "تم تحديث شعار الشركة بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ في الرفع", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    if (security.newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: security.newPassword
      });

      if (error) throw error;

      toast({
        title: "تم التغيير",
        description: "تم تغيير كلمة المرور بنجاح"
      });
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "company", label: "بيانات الشركة", icon: Building2 },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "security", label: "الأمان", icon: Shield },
    { id: "appearance", label: "المظهر", icon: Palette }
  ];

  return (
    <DashboardLayout
      title="الإعدادات"
      subtitle="إدارة إعدادات الشركة والحساب"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Company Settings */}
        {activeTab === "company" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">بيانات الشركة</h2>

            {partnerLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
                    {partner?.logo_url ? (
                      <img src={partner.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Bus className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        id="logo-upload"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button variant="outline" size="sm" asChild>
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <Upload className="w-4 h-4 ml-2" />
                          تغيير الشعار
                        </Label>
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG حتى 2MB</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الشركة</Label>
                      <Input
                        value={companyData.company_name}
                        onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الشخص المسؤول</Label>
                      <Input
                        value={companyData.contact_person}
                        onChange={(e) => setCompanyData({ ...companyData, contact_person: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>نسبة العمولة</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={companyData.commission_percentage}
                        disabled
                        className="w-24"
                      />
                      <span className="text-muted-foreground">%</span>
                      <span className="text-xs text-muted-foreground">(يتم تحديدها من قبل الإدارة)</span>
                    </div>
                  </div>

                  <Button onClick={handleSaveCompany} disabled={isSaving} className="w-fit">
                    {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                    حفظ التغييرات
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === "notifications" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">إعدادات الإشعارات</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  إشعارات البريد الإلكتروني
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">الحجوزات الجديدة</p>
                      <p className="text-sm text-muted-foreground">استلام إشعار عند كل حجز جديد</p>
                    </div>
                    <Switch
                      checked={notifications.emailBookings}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailBookings: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">المدفوعات</p>
                      <p className="text-sm text-muted-foreground">إشعارات المعاملات المالية</p>
                    </div>
                    <Switch
                      checked={notifications.emailPayments}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailPayments: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">التقارير الأسبوعية</p>
                      <p className="text-sm text-muted-foreground">ملخص أسبوعي للأداء</p>
                    </div>
                    <Switch
                      checked={notifications.emailReports}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailReports: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  إشعارات الرسائل النصية
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">الحجوزات العاجلة</p>
                      <p className="text-sm text-muted-foreground">رسالة نصية للحجوزات قبل موعد الرحلة</p>
                    </div>
                    <Switch
                      checked={notifications.smsBookings}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsBookings: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">تنبيهات الدفع</p>
                      <p className="text-sm text-muted-foreground">إشعار SMS عند فشل الدفع</p>
                    </div>
                    <Switch
                      checked={notifications.smsPayments}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsPayments: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="w-fit">
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">تغيير كلمة المرور</h2>

              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      placeholder="أدخل كلمة المرور الجديدة"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور</Label>
                  <Input
                    type="password"
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving} className="w-fit">
                  {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Lock className="w-4 h-4 ml-2" />}
                  تغيير كلمة المرور
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">معلومات الحساب</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">نوع الحساب</span>
                  <span className="font-medium text-foreground">شريك</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">حالة الحساب</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                    {partner?.status === 'approved' ? 'نشط' : partner?.status || 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">رقم الشريك</span>
                  <span className="font-mono text-foreground">#{partnerId || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">المظهر والعرض</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>اللغة</Label>
                <Select
                  value={appearanceSettings.language}
                  onValueChange={(v) => setAppearanceSettings({ ...appearanceSettings, language: v })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المظهر</Label>
                <Select
                  value={appearanceSettings.theme}
                  onValueChange={(v) => setAppearanceSettings({ ...appearanceSettings, theme: v })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="system">تلقائي (حسب النظام)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>التقويم</Label>
                <Select
                  value={appearanceSettings.calendar}
                  onValueChange={(v) => setAppearanceSettings({ ...appearanceSettings, calendar: v })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hijri">هجري</SelectItem>
                    <SelectItem value="gregorian">ميلادي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveAppearance} disabled={isSaving} className="w-fit">
                {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                حفظ التغييرات
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Bus,
  Building2,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  Save,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Database,
  Download
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
import { BackupService } from "@/lib/services/BackupService";

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
    // Settings column doesn't exist on partners table yet
    toast({
      title: "ميزة قيد التطوير",
      description: "حفظ إعدادات الإشعارات غير متاح حالياً"
    });
  };

  const handleSaveAppearance = async () => {
    // Settings column doesn't exist on partners table yet
    toast({
      title: "ميزة قيد التطوير",
      description: "حفظ إعدادات المظهر غير متاح حالياً"
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // logo_url column doesn't exist on partners table yet
    toast({
      title: "ميزة قيد التطوير",
      description: "رفع الشعار غير متاح حالياً"
    });
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
    { id: "appearance", label: "المظهر", icon: Palette },
    { id: "data", label: "إدارة البيانات", icon: Database }
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
                    <Bus className="w-12 h-12 text-primary" />
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
                      <Button variant="outline" size="sm" asChild disabled>
                        <Label htmlFor="logo-upload" className="cursor-not-allowed opacity-50">
                          تغيير الشعار (قريباً)
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
                    type={showPassword ? "text" : "password"}
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
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === "appearance" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">إعدادات المظهر</h2>

            <div className="grid gap-6 max-w-md">
              <div className="space-y-2">
                <Label>اللغة</Label>
                <Select value={appearanceSettings.language} onValueChange={(val) => setAppearanceSettings({ ...appearanceSettings, language: val })}>
                  <SelectTrigger>
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
                <Select value={appearanceSettings.theme} onValueChange={(val) => setAppearanceSettings({ ...appearanceSettings, theme: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">فاتح</SelectItem>
                    <SelectItem value="dark">داكن</SelectItem>
                    <SelectItem value="system">حسب النظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>التقويم</Label>
                <Select value={appearanceSettings.calendar} onValueChange={(val) => setAppearanceSettings({ ...appearanceSettings, calendar: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hijri">هجري</SelectItem>
                    <SelectItem value="gregorian">ميلادي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveAppearance} className="w-fit">
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </div>
          </div>
        )}

        {/* Data Management */}
        {activeTab === "data" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">إدارة البيانات</h2>

            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">تصدير بيانات الحجوزات</p>
                    <p className="text-sm text-muted-foreground">تنزيل جميع بيانات الحجوزات بصيغة Excel</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">تصدير بيانات الرحلات</p>
                    <p className="text-sm text-muted-foreground">تنزيل جميع بيانات الرحلات بصيغة Excel</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

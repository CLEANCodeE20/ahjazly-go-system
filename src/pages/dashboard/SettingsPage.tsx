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
  Download,
  Upload
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
  const { partner, partnerId, isLoading: partnerLoading, setPartner } = usePartner();
  const [activeTab, setActiveTab] = useState("company");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [companyData, setCompanyData] = useState({
    company_name: "",
    contact_person: "",
    address: "",
    commercial_registration: "",
    tax_number: "",
    website: "",
    bank_name: "",
    iban: "",
    account_number: "",
    swift_code: "",
    commercial_register_url: "",
    tax_certificate_url: "",
    commission_percentage: 10,
    logo_url: ""
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
        commercial_registration: (partner as any).commercial_registration || "",
        tax_number: (partner as any).tax_number || "",
        website: (partner as any).website || "",
        bank_name: (partner as any).bank_name || "",
        iban: (partner as any).iban || "",
        account_number: (partner as any).account_number || "",
        swift_code: (partner as any).swift_code || "",
        commercial_register_url: (partner as any).commercial_register_url || "",
        tax_certificate_url: (partner as any).tax_certificate_url || "",
        commission_percentage: partner.commission_percentage || 10,
        logo_url: partner.logo_url || ""
      });
    }
  }, [partner]);

  const handleSaveCompany = async () => {
    if (!partnerId || !partner) return;

    setIsSaving(true);
    try {
      // Detect if sensitive data (Legal/Identity) changed
      const sensitiveFieldsChanged =
        companyData.company_name !== partner.company_name ||
        companyData.commercial_registration !== (partner as any).commercial_registration ||
        companyData.tax_number !== (partner as any).tax_number ||
        companyData.commercial_register_url !== (partner as any).commercial_register_url ||
        companyData.tax_certificate_url !== (partner as any).tax_certificate_url;

      const updatePayload: any = {
        company_name: companyData.company_name,
        contact_person: companyData.contact_person,
        address: companyData.address,
        commercial_registration: companyData.commercial_registration,
        tax_number: companyData.tax_number,
        website: companyData.website,
        bank_name: companyData.bank_name,
        iban: companyData.iban,
        account_number: companyData.account_number,
        swift_code: companyData.swift_code,
        commercial_register_url: companyData.commercial_register_url,
        tax_certificate_url: companyData.tax_certificate_url,
        logo_url: companyData.logo_url
      };

      if (sensitiveFieldsChanged) {
        updatePayload.status = 'pending';
      }

      const { error } = await supabase
        .from('partners')
        .update(updatePayload)
        .eq('partner_id', partnerId);

      if (error) throw error;

      // Update local state
      if (setPartner) {
        setPartner(prev => prev ? { ...prev, ...updatePayload } : null);
      }

      toast({
        title: sensitiveFieldsChanged ? "تم إرسال الطلب للمراجعة" : "تم الحفظ",
        description: sensitiveFieldsChanged
          ? "تغيير البيانات الحساسة يتطلب مراجعة الإدارة. حسابك الآن قيد التدقيق."
          : "تم حفظ بيانات الشركة بنجاح"
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
    { id: "profile", label: "بروفايل الشركة", icon: Building2 },
    { id: "verification", label: "التوثيق والهوية", icon: Shield },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "security", label: "الأمان", icon: Lock },
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

        {/* Public Profile Settings */}
        {activeTab === "profile" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">بروفايل الشركة (عام)</h2>

            {partnerLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex items-center gap-6 mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
                    {partner?.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.company_name}
                        className="w-full h-full object-cover"
                      />
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
                        onChange={async (e) => {
                          if (e.target.files?.[0] && partnerId) {
                            setIsSaving(true);
                            try {
                              const file = e.target.files[0];
                              const fileExt = file.name.split('.').pop();
                              const fileName = `${Math.random()}.${fileExt}`;
                              const filePath = `partners/${partnerId}/${fileName}`;

                              const { error: uploadError } = await supabase.storage
                                .from('partner-assets')
                                .upload(filePath, file);

                              if (uploadError) throw uploadError;

                              const { data: { publicUrl } } = supabase.storage
                                .from('partner-assets')
                                .getPublicUrl(filePath);

                              const { error: updateError } = await supabase
                                .from('partners')
                                .update({ logo_url: publicUrl })
                                .eq('partner_id', partnerId);

                              if (updateError) throw updateError;

                              setCompanyData(prev => ({ ...prev, logo_url: publicUrl }));
                              if (setPartner) {
                                setPartner(prev => prev ? { ...prev, logo_url: publicUrl } : null);
                              }

                              toast({
                                title: "تم تحديث الشعار",
                                description: "تم رفع شعار الشركة بنجاح",
                              });
                            } catch (error: any) {
                              console.error('Logo upload error:', error);
                              toast({
                                title: "فشل الرفع",
                                description: error.message || "حدث خطأ أثناء رفع الشعار",
                                variant: "destructive"
                              });
                            } finally {
                              setIsSaving(false);
                            }
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" asChild disabled={isSaving}>
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
                          تغيير الشعار
                        </Label>
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG حتى 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المسؤول</Label>
                    <Input
                      value={companyData.contact_person}
                      onChange={(e) => setCompanyData({ ...companyData, contact_person: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الموقع الإلكتروني</Label>
                    <Input
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>العنوان الفعلي</Label>
                  <Input
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  />
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                  <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">البيانات المالية</p>
                    <p className="text-amber-800 mt-1">تعديل البيانات البنكية متاح عبر قسم مستقل للأمان.</p>
                    <Button
                      variant="link"
                      className="px-0 h-auto text-amber-900 font-bold mt-2"
                      onClick={() => window.location.href = "/partner/bank-details"}
                    >
                      إدارة الحسابات البنكية ←
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSaveCompany} disabled={isSaving} className="w-fit">
                  {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ البيانات العامة
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Legal Verification Settings */}
        {activeTab === "verification" && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">التوثيق القانوني والهوية</h2>
                <p className="text-sm text-muted-foreground">بيانات الشركة الرسمية المعتمدة في المنصة</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${partner?.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                الحالة: {partner?.status === 'approved' ? 'نشط/معتمد' : 'قيد المراجعة'}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشركة القانوني</Label>
                  <Input
                    value={companyData.company_name}
                    onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم السجل التجاري</Label>
                  <Input
                    value={companyData.commercial_registration}
                    onChange={(e) => setCompanyData({ ...companyData, commercial_registration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الرقم الضريبي (VAT)</Label>
                  <Input
                    value={companyData.tax_number}
                    onChange={(e) => setCompanyData({ ...companyData, tax_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نسبة العمولة المتفق عليها</Label>
                  <Input
                    value={`${companyData.commission_percentage}%`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-4">الوثائق الثبوتية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="flex items-center justify-between">
                      صورة السجل التجاري
                      {companyData.commercial_register_url && (
                        <a href={companyData.commercial_register_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" /> عرض الحالي
                        </a>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept=".pdf,image/*"
                        id="legal-cr-upload"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            const path = `partners/${partnerId}/docs/cr_${Date.now()}`;
                            const { data, error } = await supabase.storage.from('partner-documents').upload(path, file);
                            if (!error) {
                              const { data: { publicUrl } } = supabase.storage.from('partner-documents').getPublicUrl(path);
                              setCompanyData(prev => ({ ...prev, commercial_register_url: publicUrl }));
                              toast({ title: "تم رفع الملف", description: "سيتم إرسال التحديث للمراجعة عند الضغط على حفظ" });
                            }
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Label htmlFor="legal-cr-upload" className="cursor-pointer">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          رفع نسخة جديدة
                        </Label>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="flex items-center justify-between">
                      شهادة الضمان الزكوية/الضريبية
                      {companyData.tax_certificate_url && (
                        <a href={companyData.tax_certificate_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" /> عرض الحالي
                        </a>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept=".pdf,image/*"
                        id="legal-tax-upload"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            const path = `partners/${partnerId}/docs/tax_${Date.now()}`;
                            const { data, error } = await supabase.storage.from('partner-documents').upload(path, file);
                            if (!error) {
                              const { data: { publicUrl } } = supabase.storage.from('partner-documents').getPublicUrl(path);
                              setCompanyData(prev => ({ ...prev, tax_certificate_url: publicUrl }));
                              toast({ title: "تم رفع الملف", description: "سيتم إرسال التحديث للمراجعة عند الضغط على حفظ" });
                            }
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Label htmlFor="legal-tax-upload" className="cursor-pointer">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          رفع نسخة جديدة
                        </Label>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 text-xs">سياسة التعديل الحساس</p>
                  <p className="text-blue-800 mt-1">أي تعديل في هذا القسم سيحتاج لإعادة موافقة الإدارة قبل تفعيله، وسيبقى حسابك "قيد المراجعة" خلال هذه الفترة.</p>
                </div>
              </div>

              <Button onClick={handleSaveCompany} disabled={isSaving} className="w-fit">
                {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                تقديم طلب تحديث البيانات
              </Button>
            </div>
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

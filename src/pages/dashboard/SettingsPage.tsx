import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Bus, 
  Home,
  Route,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  MapPin,
  Ticket,
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

// Sidebar navigation
const sidebarLinks = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/dashboard/fleet", label: "إدارة الأسطول", icon: Bus },
  { href: "/dashboard/routes", label: "المسارات", icon: MapPin },
  { href: "/dashboard/trips", label: "الرحلات", icon: Route },
  { href: "/dashboard/employees", label: "الموظفين", icon: Users },
  { href: "/dashboard/branches", label: "الفروع", icon: Building2 },
  { href: "/dashboard/bookings", label: "الحجوزات", icon: Ticket },
  { href: "/dashboard/payments", label: "المدفوعات", icon: CreditCard },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
];

const SettingsPage = () => {
  const location = useLocation();
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

  // Load partner data when available
  useEffect(() => {
    if (partner) {
      setCompanyData({
        company_name: partner.company_name || "",
        contact_person: partner.contact_person || "",
        address: "",
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

  const handleSaveNotifications = () => {
    toast({
      title: "تم الحفظ",
      description: "تم حفظ إعدادات الإشعارات بنجاح"
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
    { id: "appearance", label: "المظهر", icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 translate-x-0 hidden lg:block">
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">احجزلي</span>
            <p className="text-xs text-sidebar-foreground/60">{partner?.company_name || "لوحة التحكم"}</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === link.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" asChild>
            <Link to="/">
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">الإعدادات</h1>
              <p className="text-sm text-muted-foreground">إدارة إعدادات الشركة والحساب</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
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
                    <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center">
                      <Bus className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 ml-2" />
                        تغيير الشعار
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG حتى 2MB</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>اسم الشركة</Label>
                        <Input 
                          value={companyData.company_name}
                          onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الشخص المسؤول</Label>
                        <Input 
                          value={companyData.contact_person}
                          onChange={(e) => setCompanyData({...companyData, contact_person: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>العنوان</Label>
                      <Input 
                        value={companyData.address}
                        onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
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
                        onCheckedChange={(checked) => setNotifications({...notifications, emailBookings: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">المدفوعات</p>
                        <p className="text-sm text-muted-foreground">إشعارات المعاملات المالية</p>
                      </div>
                      <Switch 
                        checked={notifications.emailPayments}
                        onCheckedChange={(checked) => setNotifications({...notifications, emailPayments: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">التقارير الأسبوعية</p>
                        <p className="text-sm text-muted-foreground">ملخص أسبوعي للأداء</p>
                      </div>
                      <Switch 
                        checked={notifications.emailReports}
                        onCheckedChange={(checked) => setNotifications({...notifications, emailReports: checked})}
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
                        onCheckedChange={(checked) => setNotifications({...notifications, smsBookings: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">تنبيهات الدفع</p>
                        <p className="text-sm text-muted-foreground">إشعار SMS عند فشل الدفع</p>
                      </div>
                      <Switch 
                        checked={notifications.smsPayments}
                        onCheckedChange={(checked) => setNotifications({...notifications, smsPayments: checked})}
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
                        onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
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
                      onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
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
                  <Select defaultValue="ar">
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
                  <Select defaultValue="light">
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
                  <Select defaultValue="hijri">
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hijri">هجري</SelectItem>
                      <SelectItem value="gregorian">ميلادي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-fit">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
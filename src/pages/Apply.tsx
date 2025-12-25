import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  XCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Apply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Owner Info
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerIdNumber: "",
    password: "",
    confirmPassword: "",
    // Company Info
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyCity: "",
    fleetSize: "",
    // Documents
    commercialRegister: null as File | null,
    taxCertificate: null as File | null,
    // Additional
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      setFormData({ ...formData, [field]: file });
    }
  };

  const removeFile = (field: string) => {
    setFormData({ ...formData, [field]: null });
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('partner-documents')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('partner-documents')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create auth user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ownerEmail,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: formData.ownerName,
            phone: formData.ownerPhone,
            user_type: 'partner'
          }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({
            title: "البريد مسجل مسبقاً",
            description: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطأ في إنشاء الحساب",
            description: authError.message,
            variant: "destructive",
          });
        }
        return;
      }

      const userId = authData.user?.id;

      // 2. Upload documents if provided
      let commercialRegisterUrl = null;
      let taxCertificateUrl = null;

      if (formData.commercialRegister) {
        commercialRegisterUrl = await uploadFile(
          formData.commercialRegister,
          `applications/${userId || 'anonymous'}/commercial`
        );
      }

      if (formData.taxCertificate) {
        taxCertificateUrl = await uploadFile(
          formData.taxCertificate,
          `applications/${userId || 'anonymous'}/tax`
        );
      }

      // 3. Create application record
      const { error: applicationError } = await supabase
        .from('partner_applications')
        .insert({
          owner_name: formData.ownerName,
          owner_phone: formData.ownerPhone,
          owner_email: formData.ownerEmail,
          owner_id_number: formData.ownerIdNumber || null,
          company_name: formData.companyName,
          company_email: formData.companyEmail || null,
          company_phone: formData.companyPhone || null,
          company_address: formData.companyAddress || null,
          company_city: formData.companyCity,
          fleet_size: formData.fleetSize ? parseInt(formData.fleetSize) : null,
          commercial_register_url: commercialRegisterUrl,
          tax_certificate_url: taxCertificateUrl,
          description: formData.description || null,
          auth_user_id: userId || null,
          status: 'pending'
        });

      if (applicationError) throw applicationError;

      // 4. Create user record in public.users table (tracking status)
      if (userId) {
        const { error: userTableError } = await supabase
          .from('users')
          .insert({
            auth_id: userId,
            full_name: formData.ownerName,
            email: formData.ownerEmail,
            phone_number: formData.ownerPhone,
            user_type: 'partner',
            account_status: 'pending'
          });

        if (userTableError) {
          console.error('Error creating user record:', userTableError);
        }
      }

      // Sign out the user since they need to wait for approval
      await supabase.auth.signOut();

      setSubmitted(true);

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في إرسال الطلب، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-16">
          <div className="max-w-md w-full px-4 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">تم إرسال طلبك بنجاح!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              شكراً لاهتمامك بالانضمام إلى منصة "احجزلي". سنقوم بمراجعة طلبك والتواصل معك عبر البريد الإلكتروني خلال 48 ساعة عمل.
            </p>
            <Button size="lg" className="w-full" asChild>
              <Link to="/">العودة للرئيسية</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!formData.ownerName || !formData.ownerPhone || !formData.ownerEmail || !formData.password || !formData.confirmPassword) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return false;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.ownerEmail)) {
        toast({
          title: "خطأ",
          description: "البريد الإلكتروني غير صحيح",
          variant: "destructive"
        });
        return false;
      }
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "خطأ",
          description: "كلمات المرور غير متطابقة",
          variant: "destructive"
        });
        return false;
      }
      if (formData.password.length < 6) {
        toast({
          title: "خطأ",
          description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
          variant: "destructive"
        });
        return false;
      }
    } else if (stepNum === 2) {
      if (!formData.companyName || !formData.companyCity) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              انضم إلى منصة احجزلي
            </h1>
            <p className="text-muted-foreground text-lg">
              أكمل النموذج التالي لتقديم طلب انضمام شركتك إلى المنصة
            </p>
          </div>

          {/* Progress Steps */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "معلومات المالك" },
                { num: 2, label: "بيانات الشركة" },
                { num: 3, label: "الوثائق" }
              ].map((s, index) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s.num
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                      }`}>
                      {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm mt-2 ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-24 md:w-32 h-1 mx-2 rounded-full transition-all ${step > s.num ? "bg-primary" : "bg-muted"
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-elegant">

              {/* Step 1: Owner Info */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">معلومات صاحب الشركة</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">الاسم الكامل *</Label>
                      <Input
                        id="ownerName"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        placeholder="أدخل اسمك الكامل"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerIdNumber">رقم الهوية</Label>
                      <Input
                        id="ownerIdNumber"
                        name="ownerIdNumber"
                        value={formData.ownerIdNumber}
                        onChange={handleInputChange}
                        placeholder="رقم الهوية الوطنية"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerPhone">رقم الجوال *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="ownerPhone"
                          name="ownerPhone"
                          type="tel"
                          value={formData.ownerPhone}
                          onChange={handleInputChange}
                          placeholder="05xxxxxxxx"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">البريد الإلكتروني *</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="ownerEmail"
                          name="ownerEmail"
                          type="email"
                          value={formData.ownerEmail}
                          onChange={handleInputChange}
                          placeholder="email@example.com"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      إنشاء كلمة مرور للحساب
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور *</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="6 أحرف على الأقل"
                            className="pr-10 pl-10"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="أعد كتابة كلمة المرور"
                            className="pr-10"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Company Info */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">بيانات الشركة</h2>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">اسم الشركة *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="الاسم التجاري للشركة"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">البريد الإلكتروني الرسمي</Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        value={formData.companyEmail}
                        onChange={handleInputChange}
                        placeholder="info@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">هاتف الشركة</Label>
                      <Input
                        id="companyPhone"
                        name="companyPhone"
                        type="tel"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        placeholder="رقم الهاتف الثابت"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">المدينة *</Label>
                      <Input
                        id="companyCity"
                        name="companyCity"
                        value={formData.companyCity}
                        onChange={handleInputChange}
                        placeholder="المدينة"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fleetSize">عدد الحافلات</Label>
                      <Input
                        id="fleetSize"
                        name="fleetSize"
                        type="number"
                        value={formData.fleetSize}
                        onChange={handleInputChange}
                        placeholder="عدد حافلات الأسطول"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">العنوان التفصيلي</Label>
                    <Textarea
                      id="companyAddress"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      placeholder="العنوان الكامل للشركة"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">الوثائق المطلوبة</h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    رفع الوثائق اختياري، لكنه يسرّع عملية مراجعة طلبك. الحد الأقصى لحجم الملف 5 ميجابايت.
                  </p>

                  <div className="space-y-4">
                    {/* Commercial Register */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${formData.commercialRegister
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                      }`}>
                      {formData.commercialRegister ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                            <div className="text-right">
                              <p className="font-medium text-foreground">السجل التجاري</p>
                              <p className="text-sm text-muted-foreground">{formData.commercialRegister.name}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile("commercialRegister")}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <XCircle className="w-5 h-5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id="commercialRegister"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, "commercialRegister")}
                          />
                          <label htmlFor="commercialRegister" className="cursor-pointer">
                            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-medium text-foreground mb-1">السجل التجاري</p>
                            <p className="text-sm text-muted-foreground">
                              اسحب الملف هنا أو اضغط للتحميل (PDF, JPG, PNG)
                            </p>
                          </label>
                        </>
                      )}
                    </div>

                    {/* Tax Certificate */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${formData.taxCertificate
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                      }`}>
                      {formData.taxCertificate ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                            <div className="text-right">
                              <p className="font-medium text-foreground">شهادة الزكاة والضريبة</p>
                              <p className="text-sm text-muted-foreground">{formData.taxCertificate.name}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile("taxCertificate")}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <XCircle className="w-5 h-5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id="taxCertificate"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, "taxCertificate")}
                          />
                          <label htmlFor="taxCertificate" className="cursor-pointer">
                            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-medium text-foreground mb-1">شهادة الزكاة والضريبة</p>
                            <p className="text-sm text-muted-foreground">
                              اسحب الملف هنا أو اضغط للتحميل (PDF, JPG, PNG)
                            </p>
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">معلومات إضافية (اختياري)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="أي معلومات إضافية ترغب في مشاركتها معنا"
                      rows={4}
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-xl p-4 mt-6">
                    <h3 className="font-medium text-foreground mb-3">ملخص الطلب</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-muted-foreground">الاسم:</p>
                      <p className="text-foreground">{formData.ownerName}</p>
                      <p className="text-muted-foreground">الشركة:</p>
                      <p className="text-foreground">{formData.companyName}</p>
                      <p className="text-muted-foreground">المدينة:</p>
                      <p className="text-foreground">{formData.companyCity}</p>
                      <p className="text-muted-foreground">البريد:</p>
                      <p className="text-foreground">{formData.ownerEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse mt-6">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground mr-2">
                      أوافق على <Link to="/terms" className="text-primary hover:underline">شروط الاستخدام</Link> و <Link to="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link> الخاصة بالمنصة
                    </Label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowRight className="w-4 h-4 ml-2" />
                    السابق
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    التالي
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        إرسال الطلب
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Help Text */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            هل لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Apply;
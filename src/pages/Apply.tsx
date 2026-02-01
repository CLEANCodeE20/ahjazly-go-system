import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

// 1. Define Zod Schema
const applyFormSchema = z.object({
  // Owner Info
  ownerName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  ownerPhone: z.string().regex(/^05\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"),
  ownerEmail: z.string().email("البريد الإلكتروني غير صحيح"),
  ownerIdNumber: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),

  // Company Info
  companyName: z.string().min(2, "اسم الشركة مطلوب"),
  companyEmail: z.string().email("بريد الشركة غير صحيح").optional().or(z.literal("")),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  companyCity: z.string().min(2, "المدينة مطلوبة"),
  commercialRegistration: z.string().min(1, "رقم السجل التجاري مطلوب"),
  fleetSize: z.preprocess((val) => Number(val), z.number().min(1, "يجب أن يكون لديك حافلة واحدة على الأقل").optional()),
  website: z.string().url("رابط الموقع غير صحيح").optional().or(z.literal("")),
  taxNumber: z.string().optional(),

  // Financial Info (Optional for now)
  bankName: z.string().optional(),
  iban: z.string().optional(),
  accountNumber: z.string().optional(),
  swiftCode: z.string().optional(),

  // Documents (We handle files manually or via custom validation, simplified here to "any" for file objects)
  commercialRegister: z.any().optional(),
  taxCertificate: z.any().optional(),
  description: z.string().optional(),

  // Terms
  acceptTerms: z.boolean().refine(val => val === true, "يجب الموافقة على الشروط"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ApplyFormValues = z.infer<typeof applyFormSchema>;

const Apply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 2. Initialize Form
  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    mode: "onChange",
    defaultValues: {
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerIdNumber: "",
      password: "",
      confirmPassword: "",
      // Company
      companyName: "",
      companyEmail: "",
      companyPhone: "",
      companyAddress: "",
      companyCity: "",
      fleetSize: undefined,
      website: "",
      commercialRegistration: "",
      taxNumber: "",
      bankName: "",
      iban: "",
      accountNumber: "",
      swiftCode: "",
      // Checkbox
      acceptTerms: false,
    }
  });

  // Helper for file upload
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

  // 3. Multi-step Validation
  const nextStep = async () => {
    let fieldsToValidate: (keyof ApplyFormValues)[] = [];

    if (step === 1) {
      fieldsToValidate = ['ownerName', 'ownerPhone', 'ownerEmail', 'password', 'confirmPassword'];
    } else if (step === 2) {
      fieldsToValidate = ['companyName', 'companyCity', 'commercialRegistration', 'website', 'taxNumber'];
    } else if (step === 3) {
      fieldsToValidate = ['bankName', 'iban', 'accountNumber'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => prev + 1);
    } else {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى التحقق من الخانات المطلوبة قبل المتابعة",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => setStep(prev => prev - 1);

  // 4. Submit Handler (Zod Verified Data)
  const onSubmit = async (values: ApplyFormValues) => {
    setIsSubmitting(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.ownerEmail,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: values.ownerName,
            phone: values.ownerPhone
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      // Upload files
      let commercialRegisterUrl = null;
      let taxCertificateUrl = null;

      if (values.commercialRegister instanceof File) {
        commercialRegisterUrl = await uploadFile(values.commercialRegister, `applications/${userId || 'anonymous'}/commercial`);
      }
      if (values.taxCertificate instanceof File) {
        taxCertificateUrl = await uploadFile(values.taxCertificate, `applications/${userId || 'anonymous'}/tax`);
      }

      // Create application
      const { error: appError } = await supabase
        .from('partner_applications')
        .insert({
          owner_name: values.ownerName,
          owner_phone: values.ownerPhone,
          owner_email: values.ownerEmail,
          owner_id_number: values.ownerIdNumber || null,
          company_name: values.companyName,
          company_email: values.companyEmail || null,
          company_phone: values.companyPhone || null,
          company_address: values.companyAddress || null,
          company_city: values.companyCity,
          fleet_size: values.fleetSize || null,
          commercial_registration: values.commercialRegistration,
          website: values.website || null,
          tax_number: values.taxNumber || null,

          bank_name: values.bankName || null,
          iban: values.iban || null,
          account_number: values.accountNumber || null,
          swift_code: values.swiftCode || null,

          commercial_register_url: commercialRegisterUrl,
          tax_certificate_url: taxCertificateUrl,
          description: values.description || null,
          auth_user_id: userId || null,
          status: 'pending'
        });

      if (appError) throw appError;

      // Create profile if user exists
      if (userId) {
        await supabase.from('users').insert({
          auth_id: userId,
          full_name: values.ownerName,
          email: values.ownerEmail,
          phone_number: values.ownerPhone,
          account_status: 'pending'
        });

        // Insert into centralized documents table
        if (commercialRegisterUrl) {
          await supabase.from('documents').insert({
            auth_id: userId,
            document_type: 'registration',
            document_url: commercialRegisterUrl,
            verification_status: 'pending'
          } as any);
        }

        if (taxCertificateUrl) {
          await supabase.from('documents').insert({
            auth_id: userId,
            document_type: 'tax_certificate',
            document_url: taxCertificateUrl,
            verification_status: 'pending'
          } as any);
        }
      }

      await supabase.auth.signOut();
      setSubmitted(true);

    } catch (error: any) {
      console.error('Submission Error:', error);
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل إرسال الطلب",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <WhatsAppButton />
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              انضم إلى منصة احجزلي
            </h1>
            <p className="text-muted-foreground text-lg">
              أكمل النموذج التالي لتقديم طلب انضمام شركتك إلى المنصة
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "معلومات المالك" },
                { num: 2, label: "بيانات الشركة" },
                { num: 3, label: "البيانات المالية" },
                { num: 4, label: "الوثائق" }
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
                  {index < 3 && (
                    <div className={`w-16 md:w-24 h-1 mx-2 rounded-full transition-all ${step > s.num ? "bg-primary" : "bg-muted"
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
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
                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل *</FormLabel>
                            <FormControl>
                              <Input placeholder="الاسم الكامل" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ownerIdNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية</FormLabel>
                            <FormControl>
                              <Input placeholder="رقم الهوية الوطنية" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ownerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الجوال *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pr-10" placeholder="05xxxxxxxx" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ownerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pr-10" type="email" placeholder="email@example.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t border-border pt-6 mt-6">
                      <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        إنشاء كلمة مرور للحساب
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>كلمة المرور *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    className="pr-10 pl-10"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="6 أحرف على الأقل"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تأكيد كلمة المرور *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    className="pr-10"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="تأكيد كلمة المرور"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم الشركة *</FormLabel>
                          <FormControl>
                            <Input placeholder="الاسم التجاري للشركة" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني للشركة</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="info@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>هاتف الشركة</FormLabel>
                            <FormControl>
                              <Input placeholder="الهاتف الثابت" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المدينة *</FormLabel>
                            <FormControl>
                              <Input placeholder="المدينة" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="commercialRegistration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم السجل التجاري *</FormLabel>
                            <FormControl>
                              <Input placeholder="1010xxxxxx" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fleetSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عدد الحافلات</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="عدد الحافلات"
                                min="1"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموقع الإلكتروني</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="taxNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الرقم الضريبي</FormLabel>
                          <FormControl>
                            <Input placeholder="الرقم الضريبي" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العنوان التفصيلي</FormLabel>
                          <FormControl>
                            <Textarea placeholder="العنوان الكامل" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Financial Info */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">البيانات المالية والبنكية</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم البنك</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم البنك" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الآيبان (IBAN)</FormLabel>
                            <FormControl>
                              <Input placeholder="SA..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الحساب</FormLabel>
                            <FormControl>
                              <Input placeholder="رقم الحساب" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="swiftCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رمز السويفت (Swift)</FormLabel>
                            <FormControl>
                              <Input placeholder="رمز السويفت" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Documents and Final Submit */}
                {step === 4 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">الوثائق المطلوبة</h2>
                    </div>

                    {/* File Uploads - Handling manually inside React Hook Form logic */}
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border p-6 rounded-xl text-center">
                        <p className="font-medium mb-2">السجل التجاري</p>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            if (e.target.files) form.setValue('commercialRegister', e.target.files[0]);
                          }}
                        />
                        {form.watch('commercialRegister') && (
                          <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> تم اختيار الملف
                          </p>
                        )}
                      </div>
                      <div className="border-2 border-dashed border-border p-6 rounded-xl text-center">
                        <p className="font-medium mb-2">شهادة الزكاة</p>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            if (e.target.files) form.setValue('taxCertificate', e.target.files[0]);
                          }}
                        />
                        {form.watch('taxCertificate') && (
                          <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> تم اختيار الملف
                          </p>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>معلومات إضافية</FormLabel>
                          <FormControl>
                            <Textarea placeholder="أي معلومات إضافية.." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 mt-1 rounded border-gray-300 text-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none mr-2">
                            <FormLabel>
                              أوافق على شروط الاستخدام وسياسة الخصوصية
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
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

                  {step < 4 ? (
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
          </Form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            هل لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </main >

      <Footer />
    </div >
  );
};

export default Apply;
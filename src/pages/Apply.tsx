import { useState, useEffect } from "react";
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

// 1. Define Enhanced Zod Schema with Best Practices
const applyFormSchema = z.object({
  // Owner Info
  ownerName: z.string()
    .min(3, "الاسم يجب أن يكون 3 أحرف على الأقل")
    .max(100, "الاسم طويل جداً")
    .trim(),

  ownerPhone: z.string()
    .regex(/^(05|5)\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام")
    .transform(val => val.startsWith('5') ? '0' + val : val), // تطبيع الرقم

  ownerEmail: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .toLowerCase()
    .trim()
    .max(255, "البريد الإلكتروني طويل جداً"),

  ownerIdNumber: z.string()
    .regex(/^\d{10}$/, "رقم الهوية يجب أن يكون 10 أرقام")
    .optional()
    .or(z.literal("")),

  password: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),

  confirmPassword: z.string(),

  // Company Info
  companyName: z.string()
    .min(2, "اسم الشركة مطلوب")
    .max(200, "اسم الشركة طويل جداً")
    .trim(),

  companyEmail: z.string()
    .email("بريد الشركة غير صحيح")
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal("")),

  companyPhone: z.string()
    .regex(/^(05|5)\d{8}$/, "رقم الهاتف غير صحيح")
    .transform(val => val.startsWith('5') ? '0' + val : val)
    .optional()
    .or(z.literal("")),

  companyAddress: z.string()
    .max(500, "العنوان طويل جداً")
    .optional(),

  companyCity: z.string()
    .min(2, "المدينة مطلوبة")
    .max(100, "اسم المدينة طويل جداً")
    .trim(),

  commercialRegistration: z.string()
    .min(1, "رقم السجل التجاري مطلوب")
    .regex(/^\d{10}$/, "رقم السجل التجاري يجب أن يكون 10 أرقام")
    .trim(),

  fleetSize: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number()
      .min(1, "يجب أن يكون لديك حافلة واحدة على الأقل")
      .max(1000, "العدد كبير جداً")
      .optional()
  ),

  website: z.string()
    .url("رابط الموقع غير صحيح")
    .trim()
    .optional()
    .or(z.literal("")),

  taxNumber: z.string()
    .regex(/^\d{15}$/, "الرقم الضريبي يجب أن يكون 15 رقم")
    .optional()
    .or(z.literal("")),

  // Financial Info
  bankName: z.string()
    .max(100, "اسم البنك طويل جداً")
    .optional(),

  iban: z.string()
    .regex(/^SA\d{22}$/, "رقم الآيبان غير صحيح (يجب أن يبدأ بـ SA ويتكون من 24 حرف)")
    .optional()
    .or(z.literal("")),

  accountNumber: z.string()
    .max(50, "رقم الحساب طويل جداً")
    .optional(),

  swiftCode: z.string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "رمز السويفت غير صحيح")
    .optional()
    .or(z.literal("")),

  // Documents (handled separately with file validation)
  commercialRegister: z.any().optional(),
  taxCertificate: z.any().optional(),

  description: z.string()
    .max(1000, "الوصف طويل جداً")
    .optional(),

  // Terms
  acceptTerms: z.boolean().refine(val => val === true, "يجب الموافقة على الشروط"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ApplyFormValues = z.infer<typeof applyFormSchema>;

// 2. File Validation Helper
const validateFile = (file: File | null): { valid: boolean; error?: string } => {
  if (!file) return { valid: true };

  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  if (file.size > maxSize) {
    return { valid: false, error: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, PDF' };
  }

  return { valid: true };
};

// 3. Rate Limiting Helper
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const checkRateLimit = (email: string): { allowed: boolean; minutesLeft?: number } => {
  const key = `apply_attempts_${email}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    const { count, timestamp } = JSON.parse(stored);
    const timePassed = Date.now() - timestamp;

    if (count >= MAX_ATTEMPTS && timePassed < LOCKOUT_TIME) {
      const minutesLeft = Math.ceil((LOCKOUT_TIME - timePassed) / 60000);
      return { allowed: false, minutesLeft };
    }

    if (timePassed >= LOCKOUT_TIME) {
      localStorage.removeItem(key);
      return { allowed: true };
    }
  }

  return { allowed: true };
};

const recordAttempt = (email: string) => {
  const key = `apply_attempts_${email}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    const { count, timestamp } = JSON.parse(stored);
    const timePassed = Date.now() - timestamp;

    if (timePassed >= LOCKOUT_TIME) {
      localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: Date.now() }));
    } else {
      localStorage.setItem(key, JSON.stringify({ count: count + 1, timestamp }));
    }
  } else {
    localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: Date.now() }));
  }
};

// 4. Input Sanitization
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 1000); // Limit length
};

const Apply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 5. Initialize Form
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

  // 6. Auto-save functionality
  useEffect(() => {
    const saveFormData = () => {
      const formData = form.getValues();
      // Don't save sensitive data
      const { password, confirmPassword, ...safeData } = formData;
      localStorage.setItem('partner_application_draft', JSON.stringify({
        ...safeData,
        savedAt: new Date().toISOString()
      }));
    };

    const interval = setInterval(saveFormData, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, [form]);

  // 7. Restore saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('partner_application_draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const savedDate = new Date(parsed.savedAt);
        const hoursSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 24) {
          const { savedAt, ...formData } = parsed;
          form.reset(formData);
          toast({
            title: "تم استعادة البيانات المحفوظة",
            description: `آخر حفظ: ${savedDate.toLocaleString('ar-SA')}`,
            duration: 5000
          });
        } else {
          localStorage.removeItem('partner_application_draft');
        }
      } catch (error) {
        console.error('Error restoring saved data:', error);
        localStorage.removeItem('partner_application_draft');
      }
    }
  }, [form]);

  // 8. Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty && !submitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty, submitted]);

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

  // 9. Submit Handler with Best Practices
  const onSubmit = async (values: ApplyFormValues) => {
    setIsSubmitting(true);

    // Track uploaded files for rollback
    let uploadedFiles: string[] = [];
    let authUserId: string | null = null;

    try {
      // 1. Rate Limiting Check
      const rateLimit = checkRateLimit(values.ownerEmail);
      if (!rateLimit.allowed) {
        toast({
          title: "تم تجاوز عدد المحاولات",
          description: `يرجى المحاولة مرة أخرى بعد ${rateLimit.minutesLeft} دقيقة`,
          variant: "destructive",
          duration: 10000
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Validate Files
      const commercialRegFile = values.commercialRegister as File | null;
      const taxCertFile = values.taxCertificate as File | null;

      const commercialValidation = validateFile(commercialRegFile);
      if (!commercialValidation.valid) {
        toast({
          title: "خطأ في ملف السجل التجاري",
          description: commercialValidation.error,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const taxValidation = validateFile(taxCertFile);
      if (!taxValidation.valid) {
        toast({
          title: "خطأ في ملف شهادة الزكاة",
          description: taxValidation.error,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', values.ownerEmail)
        .single();

      if (existingUser) {
        toast({
          title: "البريد الإلكتروني مستخدم",
          description: (
            <div className="space-y-2">
              <p>هذا البريد الإلكتروني مسجل مسبقاً في النظام.</p>
              <p className="text-sm">إذا كنت قد قدمت طلباً سابقاً، يرجى انتظار المراجعة.</p>
              <p className="text-sm">أو يمكنك <a href="/login" className="underline font-medium">تسجيل الدخول</a> إذا كان لديك حساب.</p>
            </div>
          ),
          variant: "destructive",
          duration: 8000
        });
        recordAttempt(values.ownerEmail);
        setIsSubmitting(false);
        return;
      }

      // 4. Create auth user
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

      if (authError) {
        console.error('Auth signup error:', {
          message: authError.message,
          status: authError.status,
          timestamp: new Date().toISOString()
        });

        // Handle specific auth errors
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          toast({
            title: "البريد الإلكتروني مستخدم",
            description: "هذا البريد الإلكتروني مسجل مسبقاً في نظام المصادقة.",
            variant: "destructive"
          });
        } else if (authError.message.includes('network')) {
          toast({
            title: "خطأ في الاتصال",
            description: "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
            variant: "destructive"
          });
        } else {
          toast({
            title: "خطأ في إنشاء الحساب",
            description: authError.message || "حدث خطأ غير متوقع",
            variant: "destructive"
          });
        }

        recordAttempt(values.ownerEmail);
        throw authError;
      }

      authUserId = authData.user?.id || null;

      // 5. Upload files
      let commercialRegisterUrl = null;
      let taxCertificateUrl = null;

      if (commercialRegFile instanceof File) {
        commercialRegisterUrl = await uploadFile(commercialRegFile, `applications/${authUserId || 'anonymous'}/commercial`);
        if (commercialRegisterUrl) {
          uploadedFiles.push(commercialRegisterUrl);
        } else {
          throw new Error('فشل رفع ملف السجل التجاري');
        }
      }

      if (taxCertFile instanceof File) {
        taxCertificateUrl = await uploadFile(taxCertFile, `applications/${authUserId || 'anonymous'}/tax`);
        if (taxCertificateUrl) {
          uploadedFiles.push(taxCertificateUrl);
        } else {
          throw new Error('فشل رفع ملف شهادة الزكاة');
        }
      }

      // 6. Create application with sanitized data
      const applicationData = {
        owner_name: sanitizeInput(values.ownerName),
        owner_phone: values.ownerPhone,
        owner_email: values.ownerEmail.toLowerCase(),
        owner_id_number: values.ownerIdNumber || null,
        company_name: sanitizeInput(values.companyName),
        company_email: values.companyEmail?.toLowerCase() || null,
        company_phone: values.companyPhone || null,
        company_address: values.companyAddress ? sanitizeInput(values.companyAddress) : null,
        company_city: sanitizeInput(values.companyCity),
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
        description: values.description ? sanitizeInput(values.description) : null,
        auth_user_id: authUserId,
        status: 'pending'
      };

      console.log('Submitting application:', { ...applicationData, auth_user_id: '***' });

      const { error: appError } = await supabase
        .from('partner_applications')
        .insert(applicationData);

      if (appError) {
        console.error('Application insert error:', {
          message: appError.message,
          code: appError.code,
          details: appError.details,
          timestamp: new Date().toISOString()
        });

        // Handle specific database errors
        if (appError.code === '23505') {
          toast({
            title: "بيانات مكررة",
            description: "يبدو أن هناك طلب مسجل بنفس البيانات",
            variant: "destructive"
          });
        } else if (appError.code === '23503') {
          toast({
            title: "خطأ في البيانات",
            description: "هناك مشكلة في الربط بين البيانات",
            variant: "destructive"
          });
        } else {
          toast({
            title: "خطأ في حفظ الطلب",
            description: appError.message || "حدث خطأ غير متوقع",
            variant: "destructive"
          });
        }

        throw appError;
      }

      // 7. Create user profile
      if (authUserId) {
        const { error: userError } = await supabase.from('users').insert({
          auth_id: authUserId,
          full_name: sanitizeInput(values.ownerName),
          email: values.ownerEmail.toLowerCase(),
          phone_number: values.ownerPhone,
          account_status: 'pending'
        });

        if (userError) {
          console.error('User profile creation error:', userError);
          // Don't throw here, application is already created
        }

        // 8. Insert documents
        if (commercialRegisterUrl) {
          await supabase.from('documents').insert({
            auth_id: authUserId,
            document_type: 'registration',
            document_url: commercialRegisterUrl,
            verification_status: 'pending'
          } as any);
        }

        if (taxCertificateUrl) {
          await supabase.from('documents').insert({
            auth_id: authUserId,
            document_type: 'tax_certificate',
            document_url: taxCertificateUrl,
            verification_status: 'pending'
          } as any);
        }
      }

      // 9. Sign out and clear saved data
      await supabase.auth.signOut();
      localStorage.removeItem('partner_application_draft');
      localStorage.removeItem(`apply_attempts_${values.ownerEmail}`);

      setSubmitted(true);

    } catch (error: any) {
      console.error('Submission Error:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Rollback: Delete uploaded files
      if (uploadedFiles.length > 0) {
        console.log('Rolling back uploaded files:', uploadedFiles);
        for (const fileUrl of uploadedFiles) {
          try {
            const filePath = fileUrl.split('/partner-documents/')[1];
            if (filePath) {
              await supabase.storage.from('partner-documents').remove([filePath]);
            }
          } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
          }
        }
      }

      // Note: Cannot delete auth user from client side
      if (authUserId) {
        console.warn('Auth user created but application failed. User ID:', authUserId);
      }

      // Show generic error if not already shown
      if (!error.message.includes('البريد')) {
        toast({
          title: "حدث خطأ",
          description: error.message || "فشل إرسال الطلب. يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      }

      recordAttempt(values.ownerEmail);
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
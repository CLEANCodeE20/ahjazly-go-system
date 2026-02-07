
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MapPin,
  Briefcase
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// 1. Define Enhanced Zod Schema with Yemeni Validation
const applyFormSchema = z.object({
  // Company Info
  companyName: z.string()
    .min(2, "اسم الشركة مطلوب")
    .max(200, "اسم الشركة طويل جداً")
    .trim(),

  companyCity: z.string()
    .min(1, "يرجى اختيار المدينة"), // Now a dropdown ID/Name

  companyAddress: z.string()
    .max(500, "العنوان طويل جداً")
    .optional(),

  commercialRegistration: z.string()
    .min(1, "رقم السجل التجاري مطلوب")
    .trim(),

  website: z.string()
    .url("رابط الموقع غير صحيح")
    .trim()
    .optional()
    .or(z.literal("")),

  // Owner Info
  ownerName: z.string()
    .min(3, "الاسم الرباعي مطلوب")
    .max(100, "الاسم طويل جداً")
    .trim(),

  ownerPhone: z.string()
    .regex(/^(77|73|71|70|01|02|03|04|05)\d{7}$/, "رقم الهاتف غير صحيح (يجب أن يبدأ بـ 77, 73, 71, 70 او مفتاح المحافظة)")
    .min(9, "رقم الهاتف قصير"),

  ownerEmail: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .toLowerCase()
    .trim(),

  ownerIdNumber: z.string()
    .min(5, "رقم الهوية مطلوب")
    .optional()
    .or(z.literal("")),

  password: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),

  confirmPassword: z.string(),

  // Documents
  commercialRegister: z.any()
    .refine((file) => file instanceof File, "يرجى إرفاق صورة السجل التجاري"),

  taxCertificate: z.any()
    .refine((file) => file instanceof File, "يرجى إرفاق صورة البطاقة الضريبية"),

  acceptTerms: z.boolean().refine(val => val === true, "يجب الموافقة على الشروط"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type ApplyFormValues = z.infer<typeof applyFormSchema>;

const validateFile = (file: File | null): { valid: boolean; error?: string } => {
  if (!file) return { valid: true };
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (file.size > maxSize) return { valid: false, error: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' };
  if (!allowedTypes.includes(file.type)) return { valid: false, error: 'الأنواع المسموحة: JPG, PNG, PDF' };
  return { valid: true };
};

const Apply = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<{ id: number; name_ar: string }[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  // Initialize Form
  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applyFormSchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      companyCity: "",
      companyAddress: "",
      commercialRegistration: "",
      website: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerIdNumber: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    }
  });

  // Fetch Cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('city_id, name_ar') // Assuming schema based on user info
          .order('name_ar');

        if (error) {
          console.error('Error fetching cities:', error);
          // Fallback if table structure is different or empty
          setCities([
            { id: 1, name_ar: "صنعاء" },
            { id: 2, name_ar: "عدن" },
            { id: 3, name_ar: "تعز" },
            { id: 4, name_ar: "حضرموت" },
            { id: 5, name_ar: "الحديدة" },
            { id: 6, name_ar: "إب" },
            { id: 7, name_ar: "مأرب" },
          ]);
        } else {
          // Type assertion or mapping if needed
          setCities(data?.map((c: any) => ({ id: c.city_id, name_ar: c.name_ar })) || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  // Steps Configuration
  const steps = [
    { id: 1, title: "بيانات الشركة", icon: Building2 },
    { id: 2, title: "بيانات المالك", icon: User },
    { id: 3, title: "المستندات", icon: FileText },
    { id: 4, title: "المراجعة", icon: CheckCircle2 },
  ];

  const nextStep = async () => {
    let fields: (keyof ApplyFormValues)[] = [];
    if (step === 1) fields = ['companyName', 'companyCity', 'commercialRegistration', 'companyAddress'];
    if (step === 2) fields = ['ownerName', 'ownerPhone', 'ownerEmail', 'password', 'confirmPassword'];
    if (step === 3) fields = ['commercialRegister', 'taxCertificate'];

    const isValid = await form.trigger(fields);
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const onSubmit = async (values: ApplyFormValues) => {
    setIsSubmitting(true);
    let uploadedFiles: string[] = [];

    try {
      // 1. Upload Files
      const uploadFile = async (file: File, prefix: string) => {
        const ext = file.name.split('.').pop();
        const fileName = `${prefix}_${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from('partner-documents').upload(fileName, file);
        if (error) throw error;
        uploadedFiles.push(data.path);
        const { data: urlData } = supabase.storage.from('partner-documents').getPublicUrl(data.path);
        return urlData.publicUrl;
      };

      const crUrl = await uploadFile(values.commercialRegister, 'cr');
      const taxUrl = await uploadFile(values.taxCertificate, 'tax');

      // 2. Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.ownerEmail,
        password: values.password,
        options: {
          data: { full_name: values.ownerName, phone: values.ownerPhone }
        }
      });

      if (authError) throw authError;

      // 3. Insert Application
      const { error: appError } = await supabase.from('partner_applications').insert({
        company_name: values.companyName,
        company_city: values.companyCity, // Now storing city name or ID
        company_address: values.companyAddress,
        company_email: values.ownerEmail, // Using owner email as contact for now
        company_phone: values.ownerPhone, // Using owner phone as company phone
        owner_name: values.ownerName,
        owner_phone: values.ownerPhone,
        owner_email: values.ownerEmail,
        owner_id_number: values.ownerIdNumber,
        commercial_register_url: crUrl,
        tax_certificate_url: taxUrl,
        auth_user_id: authData.user?.id,
        status: 'pending'
      });

      if (appError) throw appError;

      setStep(5); // Success Step
      toast({ title: "تم تقديم الطلب بنجاح!", description: "سيتم مراجعة طلبك وإشعارك قريباً." });

    } catch (error: any) {
      console.error(error);
      toast({ title: "حدث خطأ", description: error.message || "فشل تقديم الطلب", variant: "destructive" });
      // Cleanup uploaded files if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 5) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">تم استلام طلبك بنجاح</h2>
            <p className="text-gray-600">شكراً لاهتمامك بالانضمام إلينا. سنقوم بمراجعة طلبك والرد عليك خلال 48 ساعة عمل.</p>
            <Link to="/">
              <Button className="w-full mt-4">العودة للرئيسية</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative z-10">
              {steps.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step >= s.id ? 'bg-primary text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-400'
                    }`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium ${step >= s.id ? 'text-primary' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-32 left-0 w-full h-1 bg-gray-200 -z-0 hidden md:block">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900">طلب انضمام شريك</h1>
              <p className="text-gray-500 mt-1">انضم لشبكة أحجزلي وابدأ بتوسيع نطاق أعمالك</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step === 1 && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>اسم الشركة / المؤسسة</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Building2 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input className="pr-10" placeholder="مثال: شركة النقل السريع" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="companyCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>المحافظة/المدينة</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر المدينة" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {isLoadingCities ? (
                                      <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>
                                    ) : (
                                      cities.map((city) => (
                                        <SelectItem key={city.id} value={city.name_ar}>
                                          {city.name_ar}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="commercialRegistration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رقم السجل التجاري</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <FileText className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input className="pr-10" {...field} />
                                  </div>
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
                                  <div className="relative">
                                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input className="pr-10" placeholder="الشارع، الحي..." {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-4 mb-6">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-900">بيانات المسؤول</h4>
                            <p className="text-sm text-blue-700">ستستخدم هذه البيانات لإنشاء حساب المدير وللتواصل الرسمي.</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="ownerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>الاسم الرباعي</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="ownerPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رقم الهاتف (واتساب)</FormLabel>
                                <FormControl>
                                  <div className="relative" dir="ltr">
                                    <span className="absolute left-3 top-3 text-sm text-gray-500 font-medium">+967</span>
                                    <Input className="pl-14 text-right" placeholder="77xxxxxxx" {...field} />
                                    <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
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
                                <FormLabel>البريد الإلكتروني</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
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
                                <FormLabel>رقم الهوية / جواز السفر</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>كلمة المرور</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
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
                                <FormLabel>تأكيد كلمة المرور</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 mb-6">
                          <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            المرفقات المطلوبة
                          </h4>
                          <ul className="list-disc list-inside text-sm text-amber-700 mt-2 space-y-1">
                            <li>صورة السجل التجاري (سارية المفعول)</li>
                            <li>صورة البطاقة الضريبية</li>
                            <li>التنسيقات المدعومة: PDF, JPG, PNG (بحد أقصى 5 ميجا)</li>
                          </ul>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="commercialRegister"
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>صورة السجل التجاري</FormLabel>
                                <FormControl>
                                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gray-50/50">
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      className="hidden"
                                      id="cr-upload"
                                      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                      {...field}
                                    />
                                    <label htmlFor="cr-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                      <Upload className="h-8 w-8 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-600">
                                        {value ? (value as File).name : "اضغط لرفع الملف"}
                                      </span>
                                    </label>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="taxCertificate"
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>صورة البطاقة الضريبية</FormLabel>
                                <FormControl>
                                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gray-50/50">
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      className="hidden"
                                      id="tax-upload"
                                      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                      {...field}
                                    />
                                    <label htmlFor="tax-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                      <Upload className="h-8 w-8 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-600">
                                        {value ? (value as File).name : "اضغط لرفع الملف"}
                                      </span>
                                    </label>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                          <h3 className="text-lg font-bold">مراجعة البيانات</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">اسم الشركة</span>
                              <span className="font-medium">{form.getValues('companyName')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">المدينة</span>
                              <span className="font-medium">{form.getValues('companyCity')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">اسم المدير</span>
                              <span className="font-medium">{form.getValues('ownerName')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">رقم الهاتف</span>
                              <span className="font-medium">{form.getValues('ownerPhone')}</span>
                            </div>
                          </div>
                        </div>

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
                                  className="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none mr-3">
                                <FormLabel>
                                  أقر بصحة البيانات المرفقة وأوافق على <Link to="/terms" className="text-primary hover:underline">الشروط والأحكام</Link>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between pt-6 border-t border-gray-100">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                      <ArrowRight className="ml-2 h-4 w-4" /> السابق
                    </Button>
                  ) : <div></div>}

                  {step < 4 ? (
                    <Button type="button" onClick={nextStep}>
                      التالي <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting || !form.formState.isValid} className="bg-green-600 hover:bg-green-700">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الإرسال
                        </>
                      ) : (
                        <>تأكيد وإرسال الطلب <CheckCircle2 className="mr-2 h-4 w-4" /></>
                      )}
                    </Button>
                  )}
                </div>

              </form>
            </Form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;
import { useState } from "react";
import { Link } from "react-router-dom";
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
  MapPin, 
  FileText,
  Upload,
  CheckCircle2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Apply = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Owner Info
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerIdNumber: "",
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
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم إرسال الطلب بنجاح!",
      description: "سنراجع طلبك ونتواصل معك خلال 48 ساعة عمل.",
    });
  };

  const nextStep = () => setStep(step + 1);
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s.num 
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
                    <div className={`w-24 md:w-32 h-1 mx-2 rounded-full transition-all ${
                      step > s.num ? "bg-primary" : "bg-muted"
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
                      <Label htmlFor="ownerName">الاسم الكامل</Label>
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
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerPhone">رقم الجوال</Label>
                      <Input
                        id="ownerPhone"
                        name="ownerPhone"
                        type="tel"
                        value={formData.ownerPhone}
                        onChange={handleInputChange}
                        placeholder="05xxxxxxxx"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">البريد الإلكتروني</Label>
                      <Input
                        id="ownerEmail"
                        name="ownerEmail"
                        type="email"
                        value={formData.ownerEmail}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        required
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

                  <div className="space-y-2">
                    <Label htmlFor="companyName">اسم الشركة</Label>
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
                        required
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
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyCity">المدينة</Label>
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
                        required
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
                      required
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

                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
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
                          {formData.commercialRegister 
                            ? formData.commercialRegister.name 
                            : "اسحب الملف هنا أو اضغط للتحميل (PDF, JPG, PNG)"}
                        </p>
                      </label>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
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
                          {formData.taxCertificate 
                            ? formData.taxCertificate.name 
                            : "اسحب الملف هنا أو اضغط للتحميل (PDF, JPG, PNG)"}
                        </p>
                      </label>
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
                  <Button type="submit" variant="hero">
                    إرسال الطلب
                    <CheckCircle2 className="w-4 h-4 mr-2" />
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

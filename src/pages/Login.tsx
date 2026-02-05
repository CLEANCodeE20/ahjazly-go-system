import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { Bus, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ErrorLogger } from "@/utils/ErrorLogger";

const Login = () => {
  console.log('[Login] Rendering Login Page');
  const navigate = useNavigate();
  const { user, userRole, userStatus, isLoading: authLoading, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<"company" | "admin">("company");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [hasNotified, setHasNotified] = useState(false);

  // Detect blank page and force reload if necessary
  useEffect(() => {
    const checkContent = setTimeout(() => {
      const container = document.getElementById('login-container');
      if (!container || !container.innerHTML.trim()) {
        ErrorLogger.log(
          new Error('Login page rendered blank'),
          'Container is empty or missing - forcing reload'
        );
        console.error('[Login] Blank page detected, forcing reload');
        window.location.reload();
      }
    }, 2000);

    return () => clearTimeout(checkContent);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    console.log('[Login] State Check:', { authLoading, user: !!user, userRole: !!userRole, userStatus });

    if (!authLoading && user && userRole && !hasNotified) {
      if (userStatus && userStatus !== 'active' && userRole.role !== 'SUPERUSER') {
        setHasNotified(true);
        toast({
          title: "الحساب غير نشط",
          description: userStatus === 'pending'
            ? "حسابك قيد المراجعة حالياً، يرجى الانتظار حتى يتم تفعيله من قبل الإدارة."
            : "هذا الحساب معطل حالياً، يرجى التواصل مع الدعم الفني.",
          variant: "destructive"
        });
        return;
      }

      setHasNotified(true);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في منصة احجزلي",
      });

      if (userRole.role === 'SUPERUSER') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else if (!authLoading && user && !userRole) {
      // User has session but no profile - wait then sign out
      console.warn('[Login] User has session but no profile');

      const timer = setTimeout(async () => {
        if (user && !userRole) {
          console.error('[Login] No profile found after timeout - signing out');

          toast({
            title: "خطأ في تحميل البيانات",
            description: "لم نتمكن من تحميل بيانات حسابك. يرجى تسجيل الدخول مرة أخرى.",
            variant: "destructive"
          });

          // Sign out to clear invalid session
          await signIn('', ''); // This will trigger sign out in useAuth
          window.location.href = '/login';
        }
      }, 5000); // Wait 5 seconds for profile to load

      return () => clearTimeout(timer);
    }
  }, [user, userRole, authLoading, navigate, userStatus, hasNotified, signIn]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        if (error.message.includes("Rate limit")) {
          toast({
            title: "تم تجاوز الحد المسموح",
            description: "الرجاء الانتظار قليلاً قبل المحاولة مرة أخرى",
            variant: "destructive"
          });
        } else if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "بيانات غير صحيحة",
            description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
            variant: "destructive",
          });
        } else {
          console.error("Login Error:", error);
          toast({
            title: "خطأ في تسجيل الدخول",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('[Login] Rendering Login Page. Loading:', isLoading, 'AuthLoading:', authLoading);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30" dir="rtl" id="login-container">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-muted-foreground">
              ادخل إلى حسابك للمتابعة
            </p>
          </div>

          {/* Login Type Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              type="button"
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${loginType === "company"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setLoginType("company")}
            >
              دخول الشركات
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${loginType === "admin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setLoginType("admin")}
            >
              دخول الإدارة
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="pr-10 pl-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  تسجيل الدخول
                  <ArrowLeft className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="text-center text-muted-foreground text-sm mt-6 space-y-4">
            {loginType === "company" && (
              <p>
                ليس لديك حساب شركة؟{" "}
                <Link to="/apply" className="text-primary hover:underline font-medium">
                  قدّم طلب انضمام
                </Link>
              </p>
            )}

            <p>
              تواجه مشكلة؟{" "}
              <Link to="/contact" className="text-primary hover:underline font-medium">
                تواصل مع الدعم
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Login;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { Bus, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginType, setLoginType] = useState<"company" | "admin">("company");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Redirect based on user type
          setTimeout(() => {
            navigate("/dashboard");
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "البريد مسجل مسبقاً",
              description: "هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ في التسجيل",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "مرحباً بك في منصة احجزلي",
        });
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "بيانات غير صحيحة",
              description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ في تسجيل الدخول",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في منصة احجزلي",
        });

        if (loginType === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? "أنشئ حساباً للانضمام إلى منصة احجزلي" : "ادخل إلى حسابك للمتابعة"}
            </p>
          </div>

          {/* Login Type Tabs - Only show for login */}
          {!isSignUp && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                type="button"
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginType === "company"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLoginType("company")}
              >
                دخول الشركات
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginType === "admin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLoginType("admin")}
              >
                دخول الإدارة
              </button>
            </div>
          )}

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
                  {!isSignUp && (
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      نسيت كلمة المرور؟
                    </Link>
                  )}
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
                  {isSignUp ? "جاري إنشاء الحساب..." : "جاري تسجيل الدخول..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? "إنشاء حساب" : "تسجيل الدخول"}
                  <ArrowLeft className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Login */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            {isSignUp ? (
              <>
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary hover:underline font-medium"
                >
                  تسجيل الدخول
                </button>
              </>
            ) : (
              <>
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline font-medium"
                >
                  إنشاء حساب جديد
                </button>
                {loginType === "company" && (
                  <>
                    {" "}أو{" "}
                    <Link to="/apply" className="text-primary hover:underline font-medium">
                      قدّم طلب انضمام
                    </Link>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;

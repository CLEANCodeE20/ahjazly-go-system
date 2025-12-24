import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { Bus, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);

    useEffect(() => {
        // Check if we have a valid session (from the reset link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidToken(true);
            } else {
                toast({
                    title: "رابط غير صالح",
                    description: "الرابط منتهي الصلاحية أو غير صحيح",
                    variant: "destructive",
                });
                setTimeout(() => navigate("/forgot-password"), 2000);
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "خطأ",
                description: "كلمتا المرور غير متطابقتين",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "خطأ",
                description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                toast({
                    title: "خطأ",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "تم تغيير كلمة المرور",
                description: "تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول",
            });

            setTimeout(() => navigate("/login"), 2000);
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

    if (!isValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <div className="text-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري التحقق...</p>
                </div>
            </div>
        );
    }

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
                            إعادة تعيين كلمة المرور
                        </h1>
                        <p className="text-muted-foreground">
                            أدخل كلمة المرور الجديدة لحسابك
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pr-10 pl-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password strength indicator */}
                            {password && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-muted'}`} />
                                        <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-muted'}`} />
                                        <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-muted'}`} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {password.length < 6 ? 'ضعيفة' : password.length < 8 ? 'متوسطة' : 'قوية'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full mt-6" size="lg" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    جاري التحديث...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    تحديث كلمة المرور
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ResetPassword;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { Bus, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                toast({
                    title: "خطأ",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }

            setEmailSent(true);
            toast({
                title: "تم إرسال البريد الإلكتروني",
                description: "يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور",
            });
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
                            نسيت كلمة المرور؟
                        </h1>
                        <p className="text-muted-foreground">
                            أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                        </p>
                    </div>

                    {emailSent ? (
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">تم إرسال البريد!</h2>
                                <p className="text-muted-foreground mb-6">
                                    تحقق من بريدك الإلكتروني <span className="font-medium text-foreground">{email}</span> للحصول على رابط إعادة تعيين كلمة المرور
                                </p>
                                <Link to="/login">
                                    <Button className="w-full">
                                        <ArrowLeft className="w-4 h-4 ml-2" />
                                        العودة لتسجيل الدخول
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
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
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="pr-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-6" size="lg" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        جاري الإرسال...
                                    </span>
                                ) : (
                                    "إرسال رابط إعادة التعيين"
                                )}
                            </Button>

                            <div className="text-center mt-6">
                                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                                    <ArrowLeft className="w-4 h-4 inline ml-1" />
                                    العودة لتسجيل الدخول
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ForgotPassword;

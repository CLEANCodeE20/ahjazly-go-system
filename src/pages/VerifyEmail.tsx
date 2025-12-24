import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { Bus, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");
            const type = searchParams.get("type");

            if (!token || type !== "email") {
                setStatus("error");
                setMessage("رابط التحقق غير صالح");
                return;
            }

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: "email",
                });

                if (error) {
                    setStatus("error");
                    setMessage(error.message);
                    toast({
                        title: "خطأ في التحقق",
                        description: error.message,
                        variant: "destructive",
                    });
                } else {
                    setStatus("success");
                    setMessage("تم تأكيد بريدك الإلكتروني بنجاح!");
                    toast({
                        title: "تم التأكيد",
                        description: "يمكنك الآن تسجيل الدخول",
                    });

                    // Redirect to login after 3 seconds
                    setTimeout(() => navigate("/login"), 3000);
                }
            } catch (err) {
                setStatus("error");
                setMessage("حدث خطأ غير متوقع");
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <Header />

            <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                            <Bus className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            تأكيد البريد الإلكتروني
                        </h1>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-8 shadow-elegant">
                        {status === "loading" && (
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">جاري التحقق من بريدك الإلكتروني...</p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">تم التأكيد بنجاح!</h2>
                                <p className="text-muted-foreground mb-6">{message}</p>
                                <p className="text-sm text-muted-foreground">
                                    سيتم توجيهك لصفحة تسجيل الدخول خلال ثوانٍ...
                                </p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">فشل التأكيد</h2>
                                <p className="text-muted-foreground mb-6">{message}</p>
                                <Button onClick={() => navigate("/login")} className="w-full">
                                    العودة لتسجيل الدخول
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VerifyEmail;

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Clock, LogOut, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ApplicationStatus = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
    };

    return (
        <div className="min-h-screen flex flex-col bg-muted/30" dir="rtl">
            <Header />

            <main className="flex-1 flex items-center justify-center pt-20 pb-12 px-4">
                <div className="w-full max-w-lg bg-card rounded-2xl border border-border p-8 shadow-elegant text-center relative overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Clock className="w-10 h-10 text-yellow-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-foreground mb-4">
                        طلبك قيد المراجعة
                    </h1>

                    <div className="space-y-4 text-muted-foreground mb-8">
                        <p>
                            شكراً لاهتمامك بالانضمام إلى شركاء احجزلي.
                        </p>
                        <p>
                            يقوم فريقنا حالياً بمراجعة طلبك والتحقق من صحة البيانات والوثائق المرفقة.
                            ستصلك رسالة بريد إلكتروني فور تغيير حالة طلبك.
                        </p>
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3 text-right">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-foreground text-sm">ماذا يحدث الآن؟</p>
                                <ul className="text-sm list-disc list-inside mt-1 space-y-1">
                                    <li>التحقق من السجل التجاري</li>
                                    <li>مراجعة البيانات المالية</li>
                                    <li>تفعيل حساب الشركة</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 ml-2" />
                            تسجيل الخروج
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            هل تواجه مشكلة أو تأخر الرد؟ <span className="text-primary hover:underline cursor-pointer">تواصل مع الدعم الفني</span>
                        </p>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ApplicationStatus;

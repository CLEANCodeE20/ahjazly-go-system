import { Shield, Hammer, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
                <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto shadow-elegant animate-float">
                        <Hammer className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-md animate-bounce">
                        <Shield className="w-4 h-4 text-secondary-foreground" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                        المنصة في وضع الصيانة
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
                        نحن نقوم ببعض التحسينات لضمان تقديم أفضل خدمة ممكنة. سنعود للعمل قريباً جداً!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center gap-3">
                        <Clock className="w-6 h-6 text-primary" />
                        <div className="text-center">
                            <p className="font-semibold text-foreground">الوقت المتوقع</p>
                            <p className="text-sm text-muted-foreground">أقل من ساعتين</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center gap-3">
                        <Mail className="w-6 h-6 text-primary" />
                        <div className="text-center">
                            <p className="font-semibold text-foreground">للتواصل العاجل</p>
                            <p className="text-sm text-muted-foreground">support@ahjazly.com</p>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
                        <a href="mailto:support@ahjazly.com">أرسل لنا بريداً إلكترونياً</a>
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground pt-12">
                    &copy; {new Date().getFullYear()} احجزلي لخدمات النقل. جميع الحقوق محفوظة.
                </p>
            </div>
        </div>
    );
};

export default MaintenancePage;

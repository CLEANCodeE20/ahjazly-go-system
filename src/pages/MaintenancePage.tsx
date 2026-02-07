import { Shield, Hammer, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUISiteSettings } from "@/hooks/useSDUI";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * MaintenancePage - Premium Maintenance Mode Experience
 * 
 * Features:
 * - Dynamic content from database settings
 * - Glassmorphism design with smooth animations
 * - Contact information display
 * - Professional and reassuring user experience
 */
const MaintenancePage = () => {
    const { data: siteSettings = [], isLoading } = useUISiteSettings();

    // Extract settings from database
    const siteName = siteSettings.find(s => s.setting_key === 'site_name')?.setting_value || 'احجزلي لخدمات النقل';
    const contactEmail = siteSettings.find(s => s.setting_key === 'contact_email')?.setting_value || 'support@ahjazly.com';
    const maintenanceMessage = siteSettings.find(s => s.setting_key === 'maintenance_message')?.setting_value || 'نحن نقوم ببعض التحسينات لضمان تقديم أفضل خدمة ممكنة. سنعود للعمل قريباً جداً!';
    const estimatedTime = siteSettings.find(s => s.setting_key === 'maintenance_estimated_time')?.setting_value || 'أقل من ساعتين';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations - Animated Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
                {/* Icon with Badge */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto shadow-elegant animate-float">
                        <Hammer className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-md animate-bounce">
                        <Shield className="w-4 h-4 text-secondary-foreground" />
                    </div>
                </div>

                {/* Main Message */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                        المنصة في وضع الصيانة
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
                        {maintenanceMessage}
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
                        <Clock className="w-6 h-6 text-primary" />
                        <div className="text-center">
                            <p className="font-semibold text-foreground">الوقت المتوقع</p>
                            <p className="text-sm text-muted-foreground">{estimatedTime}</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
                        <Mail className="w-6 h-6 text-primary" />
                        <div className="text-center">
                            <p className="font-semibold text-foreground">للتواصل العاجل</p>
                            <p className="text-sm text-muted-foreground">{contactEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Contact Button */}
                <div className="pt-8">
                    <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
                        <a href={`mailto:${contactEmail}`}>أرسل لنا بريداً إلكترونياً</a>
                    </Button>
                </div>

                {/* Footer */}
                <p className="text-sm text-muted-foreground pt-12">
                    &copy; {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة.
                </p>
            </div>
        </div>
    );
};

export default MaintenancePage;

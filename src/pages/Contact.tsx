import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Mail,
    Phone,
    MapPin,
    Send,
    MessageSquare,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Clock,
    Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        toast({
            title: "تم إرسال رسالتك",
            description: "شكراً لتواصلك معنا، سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.",
        });
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="min-h-screen flex flex-col bg-background" dir="rtl">
            <Header />
            <WhatsAppButton />

            <main className="flex-1 pt-24 pb-16">
                {/* Header Section */}
                <section className="py-12 md:py-20 text-center">
                    <div className="container mx-auto px-4">
                        <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 text-primary">تواصل معنا</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">نحن هنا <span className="text-transparent bg-clip-text gradient-primary">لخدمتك دائماً</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                            لديك استفسار؟ هل تريد معرفة المزيد عن خدماتنا؟ لا تتردد في التواصل معنا عبر أي من الوسائل التالية.
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* Contact Info Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                                <h3 className="text-xl font-bold mb-8">معلومات التواصل</h3>

                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Mail className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                                            <p className="font-semibold">support@ahjazly.com</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                                            <Phone className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">الهاتف الموحد</p>
                                            <p className="font-semibold" dir="ltr">+966 9200 00000</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-6 h-6 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">المقر الرئيسي</p>
                                            <p className="font-semibold">الرياض، المملكة العربية السعودية</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">ساعات العمل</p>
                                            <p className="font-semibold">الأحد - الخميس: 9ص - 6م</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-border">
                                    <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">تابعنا على</h4>
                                    <div className="flex gap-4">
                                        {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                            <a key={i} href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all">
                                                <Icon className="w-5 h-5" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form Column */}
                        <div className="lg:col-span-2">
                            <div className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-elegant">
                                <div className="flex items-center gap-3 mb-8">
                                    <MessageSquare className="w-6 h-6 text-primary" />
                                    <h3 className="text-2xl font-bold">أرسل لنا رسالة</h3>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">الاسم الكامل</Label>
                                            <Input id="name" placeholder="أدخل اسمك الكريم" className="rounded-xl border-muted bg-muted/20 focus:bg-background transition-all h-12" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">البريد الإلكتروني</Label>
                                            <Input id="email" type="email" placeholder="example@mail.com" className="rounded-xl border-muted bg-muted/20 focus:bg-background transition-all h-12" required />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">الموضوع</Label>
                                        <Input id="subject" placeholder="عن ماذا تود الاستفسار؟" className="rounded-xl border-muted bg-muted/20 focus:bg-background transition-all h-12" required />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">رسالتك</Label>
                                        <Textarea id="message" placeholder="اكتب تفاصيل رسالتك هنا..." className="rounded-xl border-muted bg-muted/20 focus:bg-background transition-all min-h-[150px] resize-none" required />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto px-10 h-14 rounded-xl text-lg gradient-primary hover:shadow-lg transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin ml-2" />
                                                جاري الإرسال...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5 ml-2" />
                                                إرسال الرسالة
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

// Helper component for Badge since it might not be exported from common place
const Badge = ({ children, variant, className }: any) => (
    <span className={`inline-flex items-center rounded-full text-xs font-semibold ${className}`}>
        {children}
    </span>
);

export default Contact;

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
    Loader2,
    CheckCircle2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            subject: formData.get("subject") as string,
            message: formData.get("message") as string,
        };

        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert([data]);

            if (error) throw error;

            setIsSuccess(true);
            toast({
                title: "تم إرسال رسالتك بنجاح! 🎉",
                description: "شكراً لتواصلك معنا، سيقوم فريقنا بمراجعة رسالتك والرد عليك في أقرب وقت.",
                className: "bg-green-50 border-green-200",
            });
            form.reset();

            // Reset success state after 5 seconds to allow sending another message
            setTimeout(() => setIsSuccess(false), 5000);

        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "عذراً، حدث خطأ ما",
                description: "لم نتمكن من إرسال رسالتك. يرجى المحاولة مرة أخرى أو التواصل عبر الواتساب.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20" dir="rtl">
            <Header />
            <WhatsAppButton />

            <main className="flex-1 pt-24 pb-16">
                {/* Header Section with Pattern */}
                <section className="relative py-20 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-[0.03]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                    ></div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                            <span className="text-sm font-semibold">نحن هنا لخدمتك</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 tracking-tight leading-tight">
                            ابدأ محادثة <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">مع فريقنا</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                            سواء كان لديك سؤال، اقتراح، أو مشروع تود مناقشته، نحن هنا للاستماع ومساعدتك في تحقيق أهدافك.
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-4 -mt-10 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                        {/* Contact Info Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl sticky top-24">
                                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                    معلومات التواصل
                                    <div className="h-1 w-12 bg-primary rounded-full"></div>
                                </h3>

                                <div className="space-y-8">
                                    <ContactItem
                                        icon={Mail}
                                        label="البريد الإلكتروني"
                                        value="support@ahjazly.com"
                                        color="text-blue-500"
                                        bg="bg-blue-500/10"
                                    />
                                    <ContactItem
                                        icon={Phone}
                                        label="الهاتف الموحد"
                                        value="+967 71215295"
                                        subValue="متاح من 9 صباحاً - 6 مساءً"
                                        color="text-green-500"
                                        bg="bg-green-500/10"
                                        isLtr
                                    />
                                    <ContactItem
                                        icon={MapPin}
                                        label="المقر الرئيسي"
                                        value="الرياض، المملكة العربية السعودية"
                                        color="text-red-500"
                                        bg="bg-red-500/10"
                                    />
                                    <ContactItem
                                        icon={Clock}
                                        label="ساعات العمل"
                                        value="الأحد - الخميس: 9ص - 6م"
                                        color="text-purple-500"
                                        bg="bg-purple-500/10"
                                    />
                                </div>

                                <div className="mt-10 pt-8 border-t border-border/50">
                                    <h4 className="text-sm font-bold text-muted-foreground mb-5 uppercase tracking-wider flex items-center gap-2">
                                        تواصل معنا اجتماعياً
                                    </h4>
                                    <div className="flex gap-3">
                                        <SocialButton icon={Facebook} href="#" color="hover:bg-[#1877F2]" />
                                        <SocialButton icon={Twitter} href="#" color="hover:bg-[#1DA1F2]" />
                                        <SocialButton icon={Instagram} href="#" color="hover:bg-[#E4405F]" />
                                        <SocialButton icon={Linkedin} href="#" color="hover:bg-[#0A66C2]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form Column */}
                        <div className="lg:col-span-8">
                            <div className="bg-card rounded-[2.5rem] p-8 md:p-12 border border-border/50 shadow-2xl relative overflow-hidden group">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-primary/10"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -ml-32 -mb-32 transition-all duration-1000 group-hover:bg-secondary/10"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                                            <MessageSquare className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold">أرسل لنا رسالة</h3>
                                            <p className="text-muted-foreground mt-1">سنقوم بالرد عليك خلال 24 ساعة عمل</p>
                                        </div>
                                    </div>

                                    {isSuccess ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-green-800 mb-2">تم الإرسال بنجاح!</h3>
                                            <p className="text-green-600 max-w-xs mx-auto mb-8">
                                                شكراً لتواصلك. رسالتك الآن بين أيدٍ أمينة وسنرد عليك قريباً.
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsSuccess(false)}
                                                className="rounded-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                            >
                                                إرسال رسالة أخرى
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3 group/input">
                                                    <Label htmlFor="name" className="text-base font-medium group-focus-within/input:text-primary transition-colors">الاسم الكامل</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            placeholder="الاسم الكريم"
                                                            className="rounded-xl border-border bg-muted/30 focus:bg-background focus:border-primary/50 transition-all h-14 pl-4 text-lg"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3 group/input">
                                                    <Label htmlFor="email" className="text-base font-medium group-focus-within/input:text-primary transition-colors">البريد الإلكتروني</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="example@mail.com"
                                                        className="rounded-xl border-border bg-muted/30 focus:bg-background focus:border-primary/50 transition-all h-14 text-lg"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 group/input">
                                                <Label htmlFor="subject" className="text-base font-medium group-focus-within/input:text-primary transition-colors">الموضوع</Label>
                                                <Input
                                                    id="subject"
                                                    name="subject"
                                                    placeholder="عن ماذا تود الاستفسار؟"
                                                    className="rounded-xl border-border bg-muted/30 focus:bg-background focus:border-primary/50 transition-all h-14 text-lg"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-3 group/input">
                                                <Label htmlFor="message" className="text-base font-medium group-focus-within/input:text-primary transition-colors">الرسالة</Label>
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    placeholder="اكتب تفاصيل رسالتك هنا..."
                                                    className="rounded-xl border-border bg-muted/30 focus:bg-background focus:border-primary/50 transition-all min-h-[180px] resize-none text-lg p-4 leading-relaxed"
                                                    required
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full md:w-auto px-12 h-16 rounded-xl text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-300"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin ml-3" />
                                                        جاري الإرسال...
                                                    </>
                                                ) : (
                                                    <>
                                                        إرسال الرسالة
                                                        <Send className="w-5 h-5 mr-3 rtl:rotate-180" />
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

// Helper Components for improved readability
const ContactItem = ({ icon: Icon, label, value, subValue, color, bg, isLtr }: any) => (
    <div className="flex items-start gap-4 group hover:bg-muted/50 p-3 rounded-2xl transition-colors -mx-3">
        <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">{label}</p>
            <p className="font-bold text-lg text-foreground" dir={isLtr ? "ltr" : undefined}>{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
    </div>
);

const SocialButton = ({ icon: Icon, href, color }: any) => (
    <a
        href={href}
        className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground ${color} hover:text-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
    >
        <Icon className="w-5 h-5" />
    </a>
);

export default Contact;

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Target,
    Eye,
    History,
    Users2,
    Globe2,
    Award,
    TrendingUp,
    ShieldCheck,
    ArrowLeft
} from "lucide-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

const stats = [
    { label: "عام من الخبرة", value: "5+", icon: History },
    { label: "شركة شريكة", value: "100+", icon: Globe2 },
    { label: "حجز ناجح", value: "50K+", icon: TrendingUp },
    { label: "مستخدم نشط", value: "10K+", icon: Users2 },
];

const About = () => {
    return (
        <div className="min-h-screen flex flex-col bg-background" dir="rtl">
            <Header />
            <WhatsAppButton />

            <main className="flex-1 pt-24 pb-16">
                {/* Hero section with glassmorphism */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                                نحن نسهر على <span className="text-transparent bg-clip-text gradient-primary">تطوير مستقبل النقل</span> في المنطقة
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                                بدأت رحلة "أحجزلي" برؤية طموحة لتحويل قطاع نقل الركاب إلى قطاع رقمي متكامل يسهل حياة الملايين ويوفر للشركات أدوات إدارة عالمية.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-12 bg-muted/30 border-y border-border">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center group">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <stat.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</h3>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="p-8 rounded-3xl bg-card border border-border shadow-elegant hover:border-primary/20 transition-all group">
                                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6">
                                    <Target className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-4">رسالتنا</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    تمكين شركات النقل العربية من إدارة أعمالها بكفاءة عالية عبر تكنولوجيا متطورة، وتوفير تجربة حجز آمنة وسلسة للمسافرين تعتمد على الشفافية والراحة.
                                </p>
                            </div>

                            <div className="p-8 rounded-3xl bg-card border border-border shadow-elegant hover:border-secondary/20 transition-all group">
                                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                                    <Eye className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-4">رؤيتنا</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    أن نكون المنصة الرقمية الأولى والخيار المفضل لربط المسافرين بشركات النقل في منطقة الشرق الأوسط، مع المساهمة بفعالية في النهضة التقنية لقطاع النقل.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Value Cards */}
                <section className="py-20 bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground mb-4">قيمنا الجوهرية</h2>
                            <div className="w-20 h-1.5 gradient-primary mx-auto rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "الابتكار المستمر", icon: Award, desc: "نبحث دائماً عن أحدث التقنيات لدمجها في منصتنا وتقديم حلول ذكية." },
                                { title: "الأمان والخصوصية", icon: ShieldCheck, desc: "نضع حماية بيانات الشركات والمسافرين في قمة أولوياتنا كالتزام أخلاقي وتقني." },
                                { title: "الشراكة الحقيقية", icon: Globe2, desc: "لا نعتبر أنفسنا مزودي خدمة، بل شركاء نجاح لكل شركة نقل تنضم إلينا." },
                            ].map((value, index) => (
                                <div key={index} className="flex flex-col items-center text-center p-6 bg-background rounded-2xl border border-border shadow-sm group hover:bg-card transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <value.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed italic">"{value.desc}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="relative rounded-[3rem] overflow-hidden bg-foreground text-background p-12 md:p-20 text-center">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-5xl font-bold mb-8">كن جزءاً من قصة نجاحنا</h2>
                                <p className="text-xl opacity-80 mb-10 max-w-2xl mx-auto">
                                    انضم الآن إلى المستقبل وابدأ في رقمنة شركتك اليوم مع أفضل الأدوات المتاحة في السوق.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Button size="xl" className="bg-white text-black hover:bg-white/90" asChild>
                                        <Link to="/apply">سجل شركتك الآن</Link>
                                    </Button>
                                    <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                                        <Link to="/contact">تواصل معنا</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default About;

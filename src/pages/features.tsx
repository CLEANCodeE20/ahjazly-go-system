import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import {
    Bus,
    Users,
    CreditCard,
    Shield,
    BarChart3,
    ArrowLeft,
    CheckCircle2,
    Building2,
    Route,
    Globe,
    Smartphone,
    Clock,
    Zap
} from "lucide-react";
import gsap from "gsap";
import ScrollReveal from "scrollreveal";

const Features = () => {
    const headerRef = useRef(null);

    useEffect(() => {
        // GSAP Header Animation
        const ctx = gsap.context(() => {
            gsap.from(".header-content > *", {
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out"
            });
        }, headerRef);

        // ScrollReveal
        const sr = ScrollReveal({
            origin: "bottom",
            distance: "30px",
            duration: 800,
            reset: false,
            viewFactor: 0.1
        });

        sr.reveal(".feature-card", { interval: 150 });
        sr.reveal(".benefit-item", { interval: 100, origin: "left" });
        sr.reveal(".stat-card", { interval: 200, scale: 0.9 });
        sr.reveal(".cta-container", { scale: 0.95 });

        return () => {
            ctx.revert();
            sr.destroy();
        };
    }, []);

    const mainFeatures = [
        {
            icon: Bus,
            title: "إدارة الأسطول الذكية",
            description: "تتبع مركباتك لحظة بلحظة، راقب حالة السائقين، وتنبأ بأعمال الصيانة قبل حدوث الأعطال."
        },
        {
            icon: Route,
            title: "تخطيط ذكي للمسارات",
            description: "خوارزميات متطورة تقترح أفضل المسارات لتقليل استهلاك الوقود وتقليص زمن الرحلات."
        },
        {
            icon: Users,
            title: "إدارة الموارد البشرية",
            description: "نظام شامل لإدارة السائقين، الموظفين، الورديات، واحتساب الرواتب والعمولات تلقائياً."
        },
        {
            icon: Smartphone,
            title: "تطبيقات جوال متكاملة",
            description: "تطبيقات سهلة الاستخدام للسائقين والركاب، تدعم التتبع المباشر والدفع الإلكتروني."
        },
        {
            icon: CreditCard,
            title: "بوابة دفع موحدة",
            description: "استقبل المدفوعات بطرق متعددة (مدى، فيزا، أبل باي) مع تسويات مالية فورية."
        },
        {
            icon: BarChart3,
            title: "ذكاء الأعمال والتقارير",
            description: "حول بياناتك إلى قرارات مع تقارير تفاعلية توضح الأداء المالي والتشغيلي."
        }
    ];

    const benefits = [
        "واجهة عربية بالكامل وسهلة الاستخدام",
        "دعم فني متخصص على مدار الساعة 24/7",
        "تحديثات دورية مجانية للنظام",
        "استضافة سحابية آمنة في السعودية",
        "نسخ احتياطي يومي للبيانات",
        "توافق تام مع متطلبات هيئة النقل"
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
            <Header />
            <WhatsAppButton />

            {/* Hero / Header Section */}
            <section ref={headerRef} className="pt-32 pb-16 md:pt-48 md:pb-24 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/patterns/grid.svg')] opacity-5"></div>
                <div className="container mx-auto px-4 text-center header-content relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-sm mb-6 text-sm font-medium text-muted-foreground">
                        <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        نظام متكامل لإدارة النقل البري
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
                        أدوات قوية لنمو <br />
                        <span className="text-primary">أعمالك المتسارع</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        اكتشف كيف تساعدك منصة احجزلي في أتمتة عملياتك اليومية، تقليل التكاليف، وزيادة رضا عملائك من خلال حلول تقنية مبتكرة.
                    </p>
                </div>
            </section>

            {/* Main Features Grid */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {mainFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="feature-card group p-8 rounded-[2rem] bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-10 -mt-10 transition-all group-hover:bg-primary/10"></div>

                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                                </div>

                                <h3 className="text-2xl font-bold mb-3 relative z-10">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed relative z-10">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us & Stats */}
            <section className="py-24 bg-muted/30 relative">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                لماذا تختار منصة احجزلي؟
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                نحن لا نقدم مجرد نظام، بل شريك تقني ينمو معك. تم تصميم منصتنا بناءً على خبرة عميقة في سوق النقل السعودي والعربي.
                            </p>

                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="benefit-item flex items-center gap-4 p-4 rounded-xl bg-background border border-border shadow-sm">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        </div>
                                        <span className="font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { number: "95%", label: "توفير في الوقت", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
                                { number: "30%", label: "زيادة في المبيعات", icon: BarChart3, color: "text-green-500", bg: "bg-green-50" },
                                { number: "100%", label: "حماية البيانات", icon: Shield, color: "text-purple-500", bg: "bg-purple-50" },
                                { number: "24/7", label: "دعم متاح", icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
                            ].map((stat, idx) => (
                                <div key={idx} className={`stat-card p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col items-center text-center space-y-4`}>
                                    <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-foreground mb-1 font-outfit">{stat.number}</div>
                                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="cta-container bg-foreground text-background rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                                هل أنت جاهز لتحويل أعمالك؟
                            </h2>
                            <p className="text-lg text-gray-300 mb-8">
                                انضم الآن واستفد من الفترة التجريبية المجانية. لا حاجة لبطاقة ائتمان للبدء.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="xl" variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[200px]" asChild>
                                    <Link to="/apply">ابـدأ مجـاناً</Link>
                                </Button>
                                <Button size="xl" variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white min-w-[200px]" asChild>
                                    <Link to="/contact">تواصل معنا</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Features;


import { useEffect, useRef } from "react";
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
    ArrowLeft,
    Handshake,
    Lightbulb
} from "lucide-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import gsap from "gsap";
import ScrollReveal from "scrollreveal";
import Typed from "typed.js";

const stats = [
    { label: "سنة من الريادة", value: "5+", icon: History, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "شريك نجاح", value: "100+", icon: Handshake, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "عملية حجز", value: "50k+", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "عميل سعيد", value: "10k+", icon: Users2, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const About = () => {
    const heroTitleRef = useRef(null);
    const heroRef = useRef(null);
    const blob1Ref = useRef(null);
    const blob2Ref = useRef(null);

    useEffect(() => {
        // Safe check for document existence (SSR safety)
        if (typeof document === "undefined") return;

        // 1. Typed.js for Hero Title
        const typed = new Typed(heroTitleRef.current, {
            strings: [
                "تجربة السفر والنقل",
                "مفهوم الحجز الذكي",
                "مستقبل المواصلات"
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: "|",
        });

        // 2. GSAP Animations for Background Blobs
        gsap.to(blob1Ref.current, {
            x: 50,
            y: 50,
            duration: 5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        gsap.to(blob2Ref.current, {
            x: -50,
            y: -50,
            duration: 6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1
        });

        // 3. ScrollReveal Global Configuration
        const sr = ScrollReveal({
            origin: "bottom",
            distance: "60px",
            duration: 1000,
            delay: 200,
            reset: false, // Don't reset animations on scroll up
            easing: "cubic-bezier(0.5, 0, 0, 1)",
        });

        // Reveal Elements
        sr.reveal(".reveal-up", { interval: 100 });
        sr.reveal(".reveal-left", { origin: "left", distance: "100px" });
        sr.reveal(".reveal-right", { origin: "right", distance: "100px" });
        sr.reveal(".reveal-scale", { scale: 0.8, distance: "0px" });

        // Clean up
        return () => {
            typed.destroy();
            sr.destroy();
            gsap.killTweensOf([blob1Ref.current, blob2Ref.current]);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20" dir="rtl">
            <Header />
            <WhatsAppButton />

            <main className="flex-1 pt-24 pb-0">
                {/* Modern Hero Section */}
                <section ref={heroRef} className="relative py-24 md:py-32 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div ref={blob1Ref} className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-70"></div>
                        <div ref={blob2Ref} className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] opacity-70"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 shadow-sm backdrop-blur-sm mb-8 reveal-up">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-sm font-medium text-muted-foreground">المنصة الرائدة للنقل الذكي</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 leading-tight tracking-tight reveal-up">
                                نعيد تعريف <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">
                                    <span ref={heroTitleRef}></span>
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto font-light reveal-up">
                                في "أحجزلي"، لا نقدم مجرد نظام حجز، بل نبني جسوراً ذكية تربط المدن ببعضها، وتجمع المسافرين بأحبتهم، عبر تقنيات تسبق عصرها.
                            </p>

                            <div className="flex flex-wrap justify-center gap-6 reveal-up">
                                <Button size="xl" className="h-16 px-10 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 hover:scale-105 transition-all shadow-xl shadow-primary/20" asChild>
                                    <Link to="/apply">ابدأ رحلتك معنا</Link>
                                </Button>
                                <Button size="xl" variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-2 hover:bg-muted/50 transition-all" asChild>
                                    <Link to="/contact">تواصل مع الفريق</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section with Glass Effect */}
                <section className="py-12 relative z-20 -mt-10">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-card/50 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl reveal-scale">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center group p-4 rounded-2xl hover:bg-white/50 transition-colors">
                                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                        <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-foreground mb-2 tabular-nums">{stat.value}</h3>
                                    <p className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-24 bg-muted/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-border to-transparent"></div>
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <div className="relative group reveal-right">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[2.5rem] rotate-3 opacity-20 group-hover:rotate-6 transition-transform duration-500"></div>
                                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 h-[500px]">
                                    <img
                                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80"
                                        alt="فريق العمل"
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-10">
                                        <div className="text-white">
                                            <p className="text-sm font-bold uppercase tracking-wider mb-2 text-primary">قصتنا</p>
                                            <h3 className="text-3xl font-bold">من فكرة طموحة إلى واقع ملموس</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 reveal-left">
                                <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm">من نحن</div>
                                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                    نحن نصنع <br /> <span className="text-primary">المستقبل</span> الذي نطمح إليه
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    بدأت "أحجزلي" برؤية بسيطة: لماذا يجب أن يكون حجز رحلة بالحافلة أمراً معقداً؟ من هنا انطلقنا في رحلة لتحويل هذا القطاع التقليدي إلى تجربة رقمية فائقة السلاسة.
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    اليوم، نحن فخورون بخدمة الآلاف من المسافرين ومساعدة عشرات الشركات على النمو والازدهار في العصر الرقمي، مدفوعين بشغف لا يتوقف للإبتكار والتميز.
                                </p>

                                <div className="pt-4 border-t border-border">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
                                                <Target className="w-5 h-5 text-primary" />
                                                المهمة
                                            </h4>
                                            <p className="text-sm text-muted-foreground">تمكين المجتمعات عبر حلول تنقل ذكية، آمنة، وموثوقة.</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
                                                <Eye className="w-5 h-5 text-secondary" />
                                                الرؤية
                                            </h4>
                                            <p className="text-sm text-muted-foreground">أن نكون الخيار الأول للتنقل في الشرق الأوسط بحلول 2030.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-l from-transparent via-border to-transparent"></div>
                </section>

                {/* Values Section */}
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-20 reveal-up">
                            <h2 className="text-4xl font-bold mb-4">قيم نؤمن بها</h2>
                            <p className="text-muted-foreground text-lg max-w-xl mx-auto">المبادئ التي توجه كل قرار نتخذه وكل سطر كود نكتبه.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "الابتكار الجريء", icon: Lightbulb, desc: "لا ننتظر المستقبل، بل نصنعه اليوم بأفكار خارجة عن المألوف.", color: "bg-yellow-500/10 text-yellow-500" },
                                { title: "الأمان أولاً", icon: ShieldCheck, desc: "سلامة بياناتكم وأمان رحلاتكم هو الأساس غير القابل للنقاش.", color: "bg-blue-500/10 text-blue-500" },
                                { title: "التميز في الخدمة", icon: Award, desc: "نسعى للكمال في كل تفصيل، مهما كان صغيراً، لضمان رضاكم.", color: "bg-red-500/10 text-red-500" },
                            ].map((value, index) => (
                                <div key={index} className="group p-8 rounded-[2rem] border border-border bg-card hover:bg-card/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal-up" style={{ transitionDelay: `${index * 100}ms` }}>
                                    <div className={`w-16 h-16 rounded-2xl ${value.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <value.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="container mx-auto">
                        <div className="relative rounded-[3rem] overflow-hidden bg-[#0A0A0A] text-white p-12 md:p-24 text-center group reveal-scale">
                            {/* Animated Background */}
                            <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80')] bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/50 to-black/90"></div>

                            <div className="relative z-10 max-w-3xl mx-auto">
                                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">جاهز للانطلاق نحو <br /><span className="text-primary">مستقبل أفضل؟</span></h2>
                                <p className="text-xl opacity-90 mb-12 font-light">
                                    انضم إلى مئات الشركات والمستخدمين الذين يثقون في "أحجزلي" لتسهيل حياتهم وأعمالهم يومياً.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <Button size="xl" className="h-16 px-12 rounded-full text-lg font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all w-full sm:w-auto" asChild>
                                        <Link to="/apply">سجل شركتك مجاناً</Link>
                                    </Button>
                                    <Button size="xl" variant="outline" className="h-16 px-12 rounded-full text-lg font-bold border-white/20 text-white hover:bg-white/10 w-full sm:w-auto" asChild>
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

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import {
  ArrowLeft,
  CheckCircle2,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Star,
  Bus,
  Users,
  BarChart3
} from "lucide-react";
import Typed from "typed.js";
import gsap from "gsap";
import ScrollReveal from "scrollreveal";

const Index = () => {
  const heroRef = useRef(null);
  const typedRef = useRef(null);
  const heroImageRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // Typed.js for Hero Headline
    const typed = new Typed(typedRef.current, {
      strings: [
        "إدارة أسطول النقل بذكاء",
        "زيادة أرباحك وتوسع نطاق عملك",
        "تجربة حجز سلسة لعملائك",
        "أدوات تحليلية متقدمة لقرارات أدق"
      ],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 2000,
      loop: true,
      showCursor: true,
      cursorChar: "|",
    });

    // GSAP Entrance Animations
    const ctx = gsap.context(() => {
      gsap.from(".hero-content > *", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5
      });

      gsap.from(heroImageRef.current, {
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.8
      });

      // Floating animation for hero image elements
      gsap.to(".float-element", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5
      });
    }, heroRef);

    // ScrollReveal for Sections
    const sr = ScrollReveal({
      origin: "bottom",
      distance: "30px",
      duration: 1000,
      reset: false,
      viewFactor: 0.1
    });

    sr.reveal(".feature-card", { interval: 200 });
    sr.reveal(".section-title", { delay: 100 });
    sr.reveal(".benefit-item", { interval: 100, origin: "left" });
    sr.reveal(".trust-badge", { interval: 150, scale: 0.8 });

    return () => {
      typed.destroy();
      ctx.revert();
      sr.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Header />
      <WhatsAppButton />

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Blobs (Similar to About page for consistency) */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 animate-pulse-slow delay-1000" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="hero-content text-center lg:text-right space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  المنصة رقم #1 للنقل في المنطقة
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground flex flex-col gap-2">
                  <span>الحل المتكامل من أجل</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary min-h-[1.4em] pb-2 inline-block">
                    <span ref={typedRef}></span>
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  احجزلي توفر لك أحدث التقنيات لإدارة وتنمية أعمال النقل الخاصة بك. من إدارة الأسطول إلى الحجوزات والمدفوعات، كل ما تحتاجه في منصة واحدة.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Button size="xl" variant="hero" asChild className="group shadow-lg shadow-primary/20">
                    <Link to="/apply">
                      ابدأ تجربتك الآن
                      <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="group hover:bg-secondary/5 hover:border-secondary/30">
                    <Link to="/contact">
                      تواصل مع المبيعات
                    </Link>
                  </Button>
                </div>

                <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تجربة مجانية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>دعم فني 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>تفعيل فوري</span>
                  </div>
                </div>
              </div>

              <div ref={heroImageRef} className="relative lg:h-[600px] flex items-center justify-center perspective-1000">
                <div className="relative w-full max-w-lg aspect-square">
                  {/* Abstract shapes composition representing dashboard/app */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[40px] rotate-3 border border-white/10 backdrop-blur-sm shadow-2xl float-element" />
                  <div className="absolute inset-4 bg-card rounded-[32px] border border-border/50 shadow-elegant p-6 flex flex-col gap-4 rotate-[-2deg] float-element" style={{ animationDelay: '-1s' }}>
                    {/* Simulated Dashboard UI */}
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="h-2 w-20 bg-muted rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-4 rounded-xl space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Bus className="w-4 h-4 text-primary" />
                        </div>
                        <div className="h-2 w-16 bg-muted rounded-full" />
                        <div className="h-4 w-12 bg-primary/20 rounded-full" />
                      </div>
                      <div className="bg-secondary/5 p-4 rounded-xl space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="h-2 w-16 bg-muted rounded-full" />
                        <div className="h-4 w-12 bg-secondary/20 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 bg-muted/20 rounded-xl p-4 space-y-3">
                      <div className="h-2 w-full bg-muted rounded-full" />
                      <div className="h-2 w-3/4 bg-muted rounded-full" />
                      <div className="h-2 w-1/2 bg-muted rounded-full" />
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-6 -right-6 bg-background p-4 rounded-2xl shadow-xl border border-border float-element" style={{ animationDelay: '-1.5s' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3 space-x-reverse">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold">
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm font-semibold">
                        <div>+1500</div>
                        <div className="text-xs text-muted-foreground">شريك موثوق</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section ref={featuresRef} className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 section-title">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">كل ما تحتاجه للنجاح</h2>
              <p className="text-lg text-muted-foreground">
                نقدم لك مجموعة متكاملة من الأدوات المصممة خصيصاً لتلبية احتياجات شركات النقل الحديثة
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Globe,
                  title: "نظام حجز مركزي",
                  desc: "استقبال الحجوزات من الموقع وتطبيقات الجوال ونقاط البيع في لوحة موحدة."
                },
                {
                  icon: Smartphone,
                  title: "تطبيقات للجوال",
                  desc: "تطبيقات مخصصة للعملاء والسائقين تعمل على أنظمة iOS و Android."
                },
                {
                  icon: Shield,
                  title: "حماية وأمان",
                  desc: "بنية تحتية سحابية آمنة مع نسخ احتياطي دوري وتشفير للبيانات."
                },
                {
                  icon: Zap,
                  title: "سرعة في الأداء",
                  desc: "تقنيات حديثة تضمن سرعة تحميل عالية وتجربة مستخدم سلسة."
                },
                {
                  icon: BarChart3,
                  title: "تحليلات متقدمة",
                  desc: "لوحات معلومات تفاعلية وتقارير دورية تساعدك في اتخاذ القرارات."
                },
                {
                  icon: Users,
                  title: "إدارة علاقات العملاء",
                  desc: "أدوات متطورة لإدارة قاعدة بيانات عملائك وتحسين ولائهم."
                }
              ].map((feature, idx) => (
                <div key={idx} className="feature-card group p-8 rounded-3xl bg-background border border-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust/Stats Section */}
        <section className="py-20 bg-primary/5 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "500+", label: "شركة نقل" },
                { number: "100K+", label: "مستخدم نشط" },
                { number: "1M+", label: "حجز ناجح" },
                { number: "99.9%", label: "جاهزية النظام" },
              ].map((stat, idx) => (
                <div key={idx} className="trust-badge space-y-2">
                  <div className="text-4xl lg:text-5xl font-bold text-primary font-outfit">{stat.number}</div>
                  <div className="text-lg text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-br from-primary to-purple-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                  <Star className="w-8 h-8 text-white fill-current" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white">
                  انتقل بأعمالك إلى المستوى التالي
                </h2>
                <p className="text-xl text-white/90 leading-relaxed">
                  ابدأ رحلة النجاح اليوم مع منصة احجزلي. انضم لأكثر من 500 شركة تثق بنا في إدارة عملياتها.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="xl" variant="secondary" asChild className="text-primary font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <Link to="/apply">
                      سجّل شركتك الآن
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" asChild>
                    <Link to="/contact">
                      تحدث مع خبير
                    </Link>
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

export default Index;


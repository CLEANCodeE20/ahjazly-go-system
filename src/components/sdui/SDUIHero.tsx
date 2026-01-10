import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Bus, Users } from "lucide-react";
import Typed from "typed.js";
import gsap from "gsap";
import { UIComponent } from "@/hooks/useSDUI";

interface SDUIHeroProps {
    component: UIComponent;
}

export const SDUIHero = ({ component }: SDUIHeroProps) => {
    const { title, subtitle, content, button_text, button_url, background_image, custom_data } = component;
    const heroRef = useRef(null);
    const typedRef = useRef(null);
    const heroImageRef = useRef(null);

    // Extract custom data safely
    const typedStrings = (custom_data?.typed_strings as string[]) || [
        "إدارة أسطول النقل بذكاء",
        "زيادة أرباحك وتوسع نطاق عملك",
        "تجربة حجز سلسة لعملائك"
    ];

    const features = (custom_data?.features as string[]) || [
        "تجربة مجانية",
        "دعم فني 24/7",
        "تفعيل فوري"
    ];

    const secondaryButtonText = custom_data?.secondary_button_text as string;
    const secondaryButtonUrl = custom_data?.secondary_button_url as string;

    useEffect(() => {
        // Typed.js for Hero Headline
        const typed = new Typed(typedRef.current, {
            strings: typedStrings,
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

        return () => {
            typed.destroy();
            ctx.revert();
        };
    }, [typedStrings]);

    return (
        <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 animate-pulse-slow delay-1000" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="hero-content text-center lg:text-right space-y-6">
                        {subtitle && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                {subtitle}
                            </div>
                        )}

                        <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground flex flex-col gap-2">
                            <span>{title}</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary min-h-[1.4em] pb-2 inline-block">
                                <span ref={typedRef}></span>
                            </span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            {content}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            {button_text && button_url && (
                                <Button size="xl" variant="hero" asChild className="group shadow-lg shadow-primary/20">
                                    <Link to={button_url}>
                                        {button_text}
                                        <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            )}
                            {secondaryButtonText && secondaryButtonUrl && (
                                <Button size="xl" variant="outline" asChild className="group hover:bg-secondary/5 hover:border-secondary/30">
                                    <Link to={secondaryButtonUrl}>
                                        {secondaryButtonText}
                                    </Link>
                                </Button>
                            )}
                        </div>

                        <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground flex-wrap">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div ref={heroImageRef} className="relative lg:h-[600px] flex items-center justify-center perspective-1000">
                        <div className="relative w-full max-w-lg aspect-square">
                            {/* Abstract shapes composition */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[40px] rotate-3 border border-white/10 backdrop-blur-sm shadow-2xl float-element" />

                            {background_image ? (
                                <img
                                    src={background_image}
                                    alt="Hero"
                                    className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover rounded-[32px] border border-border/50 shadow-elegant rotate-[-2deg] float-element"
                                    style={{ animationDelay: '-1s' }}
                                />
                            ) : (
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
                            )}

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
    );
};

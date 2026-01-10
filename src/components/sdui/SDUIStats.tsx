import { useEffect, useRef } from "react";
import { UIComponent } from "@/hooks/useSDUI";
import ScrollReveal from "scrollreveal";

interface SDUIStatsProps {
    component: UIComponent;
}

export const SDUIStats = ({ component }: SDUIStatsProps) => {
    const { custom_data } = component;
    const statsRef = useRef(null);

    const stats = (custom_data?.stats as any[]) || [
        { number: "500+", label: "شركة نقل" },
        { number: "100K+", label: "مستخدم نشط" },
        { number: "1M+", label: "حجز ناجح" },
        { number: "99.9%", label: "جاهزية النظام" },
    ];

    useEffect(() => {
        const sr = ScrollReveal({
            origin: "bottom",
            distance: "30px",
            duration: 1000,
            reset: false,
            viewFactor: 0.1
        });

        sr.reveal(".trust-badge", { interval: 150, scale: 0.8 });

        return () => {
            sr.destroy();
        };
    }, []);

    return (
        <section ref={statsRef} className="py-20 bg-primary/5 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="trust-badge space-y-2">
                            <div className="text-4xl lg:text-5xl font-bold text-primary font-outfit">{stat.number}</div>
                            <div className="text-lg text-muted-foreground font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

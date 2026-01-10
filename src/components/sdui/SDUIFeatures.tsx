import { useEffect, useRef } from "react";
import { UIComponent } from "@/hooks/useSDUI";
import { Globe, Smartphone, Shield, Zap, BarChart3, Users, LucideIcon, Bus, CreditCard, Building2, Route, CheckCircle2 } from "lucide-react";
import ScrollReveal from "scrollreveal";

interface SDUIFeaturesProps {
    component: UIComponent;
}

const iconMap: Record<string, LucideIcon> = {
    bus: Bus,
    users: Users,
    creditCard: CreditCard,
    shield: Shield,
    barChart: BarChart3,
    building: Building2,
    route: Route,
    check: CheckCircle2,
    globe: Globe,
    smartphone: Smartphone,
    zap: Zap,
};

export const SDUIFeatures = ({ component }: SDUIFeaturesProps) => {
    const { title, content, custom_data } = component;
    const featuresRef = useRef(null);
    const featuresList = (custom_data?.features as any[]) || [];

    useEffect(() => {
        const sr = ScrollReveal({
            origin: "bottom",
            distance: "30px",
            duration: 1000,
            reset: false,
            viewFactor: 0.1
        });

        sr.reveal(".feature-card", { interval: 200 });
        sr.reveal(".section-title", { delay: 100 });

        return () => {
            sr.destroy();
        };
    }, []);

    return (
        <section ref={featuresRef} className="py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16 section-title">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">{title}</h2>
                    <p className="text-lg text-muted-foreground">
                        {content}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuresList.map((feature, idx) => {
                        const Icon = iconMap[feature.icon] || Globe;
                        return (
                            <div key={idx} className="feature-card group p-8 rounded-3xl bg-background border border-border hover:border-primary/50 hover:shadow-elegant transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

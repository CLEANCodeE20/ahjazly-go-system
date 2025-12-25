import { UIComponent } from "@/hooks/useSDUI";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
    LucideIcon
} from "lucide-react";

interface SDUISectionProps {
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
};

export const SDUISection = ({ component }: SDUISectionProps) => {
    const { component_type, title, subtitle, content, button_text, button_url, background_image, custom_data } = component;

    switch (component_type) {
        case 'hero':
            return (
                <section className="pt-24 pb-16 md:pt-32 md:pb-24 gradient-hero relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

                    <div className="container mx-auto px-4 relative">
                        <div className="max-w-3xl mx-auto text-center">
                            {subtitle && (
                                <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 animate-fade-in">
                                    <Shield className="w-4 h-4 text-secondary" />
                                    <span className="text-primary-foreground/90 text-sm">{subtitle}</span>
                                </div>
                            )}

                            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
                                {title}
                            </h1>

                            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed animate-fade-in">
                                {content}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                                {button_text && button_url && (
                                    <Button variant="hero-outline" size="xl" asChild>
                                        <Link to={button_url} className="flex items-center gap-2">
                                            {button_text}
                                            <ArrowLeft className="w-5 h-5" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                </section>
            );

        case 'features':
            const featuresList = (custom_data?.features as any[]) || [];
            return (
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{content}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuresList.map((feature, index) => {
                                const Icon = iconMap[feature.icon] || Bus;
                                return (
                                    <div
                                        key={index}
                                        className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-elegant"
                                    >
                                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <Icon className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                                        <p className="text-muted-foreground">{feature.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            );

        case 'benefits':
            const benefitsList = (custom_data?.benefits as string[]) || [];
            return (
                <section className="py-16 md:py-24 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{title}</h2>
                                <p className="text-muted-foreground text-lg mb-8">{content}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {benefitsList.map((benefit, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                                            <span className="text-foreground">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                {button_text && button_url && (
                                    <Button variant="default" size="lg" className="mt-8" asChild>
                                        <Link to={button_url}>{button_text}</Link>
                                    </Button>
                                )}
                            </div>

                            <div className="relative">
                                <div className="aspect-square rounded-3xl gradient-primary p-8 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                        {(custom_data?.stats as any[])?.map((stat, i) => (
                                            <div key={i} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 text-center animate-float" style={{ animationDelay: `${i}s` }}>
                                                <div className="text-3xl font-bold text-primary-foreground">{stat.value}</div>
                                                <div className="text-primary-foreground/70 text-sm">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            );

        case 'cta':
            return (
                <section className="py-16 md:py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto text-center bg-card rounded-3xl p-8 md:p-12 border border-border shadow-elegant">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
                            <p className="text-muted-foreground text-lg mb-8">{content}</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {button_text && button_url && (
                                    <Button variant="hero" size="xl" asChild>
                                        <Link to={button_url} className="flex items-center gap-2">
                                            {button_text}
                                            <ArrowLeft className="w-5 h-5" />
                                        </Link>
                                    </Button>
                                )}
                                {custom_data?.secondary_button_text && (
                                    <Button variant="outline" size="xl" asChild>
                                        <Link to={(custom_data?.secondary_button_url as string) || "#"}>
                                            {custom_data?.secondary_button_text as string}
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            );

        case 'banner':
            return (
                <section
                    className="relative min-h-[200px] md:min-h-[300px] flex items-center justify-center"
                    style={{
                        backgroundImage: background_image ? `url(${background_image})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-l from-background/80 to-background/40" />
                    <div className="container mx-auto px-4 py-8 relative z-10">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">{title}</h2>
                            <p className="text-lg md:text-xl text-muted-foreground mb-2">{subtitle}</p>
                            <p className="text-muted-foreground mb-4">{content}</p>
                            {button_text && button_url && (
                                <Button asChild variant="default" size="lg">
                                    <a href={button_url} target="_blank" rel="noopener noreferrer">
                                        {button_text}
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>
            );

        default:
            return null;
    }
};

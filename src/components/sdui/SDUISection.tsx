import { UIComponent } from "@/hooks/useSDUI";
import { SDUIHero } from "./SDUIHero";
import { SDUIFeatures } from "./SDUIFeatures";
import { SDUIStats } from "./SDUIStats";
import { SDUICTA } from "./SDUICTA";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface SDUISectionProps {
    component: UIComponent;
}

export const SDUISection = ({ component }: SDUISectionProps) => {
    const { component_type, title, content, button_text, button_url, background_image, custom_data } = component;

    switch (component_type) {
        case 'hero':
            return <SDUIHero component={component} />;

        case 'features':
            return <SDUIFeatures component={component} />;

        case 'stats': // New type for stats section
            return <SDUIStats component={component} />;

        case 'cta':
            return <SDUICTA component={component} />;

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


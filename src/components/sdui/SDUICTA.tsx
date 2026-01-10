import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { UIComponent } from "@/hooks/useSDUI";

interface SDUICTAProps {
    component: UIComponent;
}

export const SDUICTA = ({ component }: SDUICTAProps) => {
    const { title, content, button_text, button_url, custom_data } = component;

    const secondaryButtonText = custom_data?.secondary_button_text as string;
    const secondaryButtonUrl = custom_data?.secondary_button_url as string;

    return (
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
                            {title}
                        </h2>
                        <p className="text-xl text-white/90 leading-relaxed">
                            {content}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            {button_text && button_url && (
                                <Button size="xl" variant="secondary" asChild className="text-primary font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                    <Link to={button_url}>
                                        {button_text}
                                    </Link>
                                </Button>
                            )}
                            {secondaryButtonText && secondaryButtonUrl && (
                                <Button size="xl" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" asChild>
                                    <Link to={secondaryButtonUrl}>
                                        {secondaryButtonText}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

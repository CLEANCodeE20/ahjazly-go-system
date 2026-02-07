import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Banner {
    id: number;
    title: string;
    image_url: string;
    target_url: string;
    display_order: number;
}

export const BannerSlider = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const { data, error } = await supabase
                    .from("banners")
                    .select("*")
                    .eq("is_active", true)
                    .order("display_order", { ascending: true });

                if (error) throw error;
                setBanners(data || []);
            } catch (err) {
                console.error("Error fetching banners:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [banners.length]);

    const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

    if (loading) {
        return (
            <div className="container mx-auto px-4 mt-8">
                <Skeleton className="w-full aspect-[21/9] md:aspect-[3/1] rounded-3xl" />
            </div>
        );
    }

    if (banners.length === 0) return null;

    return (
        <section className="container mx-auto px-4 mt-8 md:mt-12 relative group">
            <div className="relative overflow-hidden rounded-[32px] aspect-[21/9] md:aspect-[3/1] shadow-2xl border border-white/10">
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentIndex
                                ? "opacity-100 translate-x-0 scale-100"
                                : "opacity-0 translate-x-full scale-105 pointer-events-none"
                            }`}
                    >
                        <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute bottom-0 right-0 left-0 p-6 md:p-12 md:pb-16 flex flex-col items-start gap-3">
                            <h2 className="text-xl md:text-4xl lg:text-5xl font-bold text-white max-w-2xl drop-shadow-lg leading-tight">
                                {banner.title}
                            </h2>

                            {banner.target_url && (
                                <Button
                                    asChild
                                    variant="hero"
                                    size="lg"
                                    className="mt-2 group/btn"
                                >
                                    <a href={banner.target_url} target="_blank" rel="noopener noreferrer">
                                        اكتشف المزيد
                                        <ChevronLeft className="mr-2 w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Navigation Arrows */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Indicators */}
                {banners.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-primary" : "w-1.5 bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

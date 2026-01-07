import { useUIComponents, useUIAdvertisements, useUIPromotions } from "@/hooks/useSDUI";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Copy, CheckCircle, Ticket, Sparkles, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface SDUIBannerProps {
  page?: 'home' | 'search' | 'booking' | 'about' | 'contact' | 'all';
}

const SDUIBanner = ({ page = 'home' }: SDUIBannerProps) => {
  const { data: components = [], isLoading: componentsLoading } = useUIComponents();
  const { data: advertisements = [], isLoading: adsLoading } = useUIAdvertisements();
  const { data: promotions = [], isLoading: promosLoading } = useUIPromotions();

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Filter active components for this page
  const activeBanners = components.filter(
    c => c.component_type === 'banner' &&
      c.status === 'published' &&
      (!c.start_date || new Date(c.start_date) <= new Date()) &&
      (!c.end_date || new Date(c.end_date) >= new Date())
  );

  // Filter active advertisements for this page
  const activeAds = advertisements.filter(
    ad => ad.is_active &&
      ad.target_pages?.includes(page) &&
      (!ad.start_date || new Date(ad.start_date) <= new Date()) &&
      (!ad.end_date || new Date(ad.end_date) >= new Date())
  );

  // Filter active promotions to display on home
  const activePromos = promotions.filter(
    promo => promo.is_active &&
      promo.display_on_home &&
      new Date(promo.start_date) <= new Date() &&
      new Date(promo.end_date) >= new Date()
  );

  // Auto-rotate banners
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // Auto-rotate ads
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [activeAds.length]);

  const nextBanner = () => {
    setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رمز الخصم إلى الحافظة",
    });
  };

  const isLoading = componentsLoading || adsLoading || promosLoading;

  if (isLoading) {
    return null;
  }

  const currentBanner = activeBanners[currentBannerIndex];
  const currentAd = activeAds[currentAdIndex];

  return (
    <div className="space-y-4">
      {/* Hero Banners Carousel - Premium Architectural Experience */}
      {activeBanners.length > 0 && (
        <section className="relative w-full overflow-hidden">
          <div className="relative">
            {currentBanner && (
              <div
                className="relative min-h-[400px] md:min-h-[550px] flex items-center justify-center transition-all duration-1000 ease-in-out"
                style={{
                  backgroundImage: currentBanner.background_image ? `url(${currentBanner.background_image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Advanced Multi-layered Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-0" />
                <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />

                <div className="container mx-auto px-6 relative z-10">
                  <div className="max-w-2xl animate-slide-up space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 text-primary text-sm font-bold backdrop-blur-xl border border-primary/20 shadow-sm">
                      <Sparkles className="w-4 h-4 fill-primary" />
                      تجربة سفر متميزة وحصرية
                    </div>

                    {currentBanner.title && (
                      <h2 className="text-4xl md:text-7xl font-black text-foreground leading-[1.05] drop-shadow-sm tracking-tight font-cairo">
                        {currentBanner.title}
                      </h2>
                    )}

                    {currentBanner.subtitle && (
                      <p className="text-2xl md:text-3xl text-primary font-extrabold tracking-wide">
                        {currentBanner.subtitle}
                      </p>
                    )}

                    {currentBanner.content && (
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl font-medium">
                        {currentBanner.content}
                      </p>
                    )}

                    {currentBanner.button_text && currentBanner.button_url && (
                      <div className="pt-6">
                        <Button asChild size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-glow hover:scale-105 active:scale-95 transition-all duration-300 group">
                          <a href={currentBanner.button_url} target="_blank" rel="noopener noreferrer">
                            {currentBanner.button_text}
                            <ChevronLeft className="w-6 h-6 mr-2 group-hover:-translate-x-1 transition-transform" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Arrows - Architectural Design */}
            {activeBanners.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-8 pointer-events-none">
                <button
                  onClick={prevBanner}
                  className="pointer-events-auto w-14 h-14 rounded-3xl bg-background/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center transition-all hover:bg-background/80 hover:scale-110 shadow-2xl group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ChevronRight className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform relative z-10" />
                </button>
                <button
                  onClick={nextBanner}
                  className="pointer-events-auto w-14 h-14 rounded-3xl bg-background/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center transition-all hover:bg-background/80 hover:scale-110 shadow-2xl group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ChevronLeft className="w-8 h-8 text-foreground group-hover:scale-110 transition-transform relative z-10" />
                </button>
              </div>
            )}

            {/* Progressive Navigation Indicators */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4 p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className="relative h-1.5 overflow-hidden transition-all duration-500 rounded-full bg-foreground/20"
                    style={{ width: index === currentBannerIndex ? '56px' : '14px' }}
                  >
                    {index === currentBannerIndex && (
                      <div className="absolute inset-0 bg-primary animate-pulse-slow shadow-glow" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Premium Advertisements Section */}
      {activeAds.length > 0 && currentAd && (
        <section className="py-6 px-6">
          <div className="container mx-auto">
            <a
              href={currentAd.link_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block rounded-3xl overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-500 border border-border bg-card"
            >
              <div className="flex flex-col md:flex-row items-center">
                <div className="relative w-full md:w-2/5 h-48 md:h-64 overflow-hidden">
                  {currentAd.image_url ? (
                    <img
                      src={currentAd.image_url}
                      alt={currentAd.alt_text || currentAd.ad_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <Megaphone className="w-16 h-16 text-primary-foreground/20 animate-float" />
                    </div>
                  )}
                  {/* Glass Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/30 backdrop-blur-xl border border-white/20 text-[10px] uppercase tracking-tighter font-bold text-white z-10">
                    إعلان ممول
                  </div>
                </div>

                <div className="w-full md:w-3/5 p-8 flex flex-col justify-center space-y-4">
                  <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                    {currentAd.ad_name}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed line-clamp-2">
                    {currentAd.alt_text || "اكتشف أفضل العروض والخدمات المتميزة المتاحة الآن عبر شركائنا الموثوقين."}
                  </p>
                  <div className="flex items-center text-primary font-bold text-lg group-hover:gap-3 gap-2 transition-all">
                    عرض التفاصيل
                    <ChevronLeft className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </a>
          </div>
        </section>
      )}

      {/* Professional Promotions Section */}
      {activePromos.length > 0 && (
        <section className="py-12 bg-muted/10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
              <div className="text-center md:text-right">
                <h3 className="text-3xl font-black text-foreground mb-2 flex items-center justify-center md:justify-start gap-3">
                  <Ticket className="w-8 h-8 text-primary" />
                  العروض الحصرية
                </h3>
                <p className="text-muted-foreground text-lg">استفد من خصوماتنا المميزة لفترة محدودة</p>
              </div>
              <Button variant="outline" className="rounded-xl font-bold border-primary/20 hover:bg-primary/5">
                عرض جميع العروض
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePromos.map((promo) => (
                <div
                  key={promo.promo_id}
                  className="group relative rounded-3xl border border-border bg-card overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="relative h-48 overflow-hidden">
                    {promo.banner_image ? (
                      <img
                        src={promo.banner_image}
                        alt={promo.promo_name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full gradient-secondary flex items-center justify-center">
                        <Ticket className="w-16 h-16 text-white/20 animate-float" />
                      </div>
                    )}

                    {/* Discount Badge */}
                    {promo.discount_value && (
                      <div className="absolute top-4 left-4 h-16 w-16 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform font-black">
                        <span className="text-sm">خصم</span>
                        <span className="text-xl">
                          {promo.promo_type === 'percentage' ? `${promo.discount_value}%` : promo.discount_value}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{promo.promo_name}</h4>

                    {promo.promo_code && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border group/code">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono font-bold text-lg tracking-wider text-primary">{promo.promo_code}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(promo.promo_code!)}
                          className="p-2 rounded-lg bg-background hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                          title="نسخ الكود"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {promo.terms_conditions && (
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">
                        * {promo.terms_conditions}
                      </p>
                    )}

                    <div className="pt-2">
                      <Button variant="ghost" className="w-full rounded-xl font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        احجز الآن بالعرض
                        <ChevronLeft className="w-4 h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SDUIBanner;

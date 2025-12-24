import { useUIComponents, useUIAdvertisements, useUIPromotions } from "@/hooks/useSDUI";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

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

  const isLoading = componentsLoading || adsLoading || promosLoading;

  if (isLoading) {
    return null;
  }

  const currentBanner = activeBanners[currentBannerIndex];
  const currentAd = activeAds[currentAdIndex];

  return (
    <>
      {/* Hero Banners Carousel */}
      {activeBanners.length > 0 && (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="relative">
            {currentBanner && (
              <div 
                className="relative min-h-[200px] md:min-h-[300px] flex items-center justify-center transition-all duration-500"
                style={{
                  backgroundImage: currentBanner.background_image ? `url(${currentBanner.background_image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-l from-background/80 to-background/40" />
                
                <div className="container mx-auto px-4 py-8 relative z-10">
                  <div className="max-w-2xl">
                    {currentBanner.title && (
                      <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                        {currentBanner.title}
                      </h2>
                    )}
                    {currentBanner.subtitle && (
                      <p className="text-lg md:text-xl text-muted-foreground mb-2">
                        {currentBanner.subtitle}
                      </p>
                    )}
                    {currentBanner.content && (
                      <p className="text-muted-foreground mb-4">
                        {currentBanner.content}
                      </p>
                    )}
                    {currentBanner.button_text && currentBanner.button_url && (
                      <Button asChild variant="default" size="lg">
                        <a href={currentBanner.button_url} target="_blank" rel="noopener noreferrer">
                          {currentBanner.button_text}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Arrows */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={prevBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors shadow-md"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors shadow-md"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentBannerIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Advertisements Section */}
      {activeAds.length > 0 && currentAd && (
        <section className="py-4 bg-muted/30">
          <div className="container mx-auto px-4">
            <a 
              href={currentAd.link_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative rounded-xl overflow-hidden group hover:shadow-lg transition-shadow"
            >
              {currentAd.image_url && (
                <img 
                  src={currentAd.image_url} 
                  alt={currentAd.alt_text || currentAd.ad_name}
                  className="w-full h-auto max-h-[150px] object-cover"
                />
              )}
              {!currentAd.image_url && (
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
                  <p className="text-primary-foreground font-semibold text-lg">
                    {currentAd.ad_name}
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Promotions Section */}
      {activePromos.length > 0 && (
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4">
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">
              العروض الحالية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activePromos.map((promo) => (
                <div 
                  key={promo.promo_id}
                  className="relative rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  {promo.banner_image && (
                    <img 
                      src={promo.banner_image} 
                      alt={promo.promo_name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="font-semibold text-foreground mb-1">{promo.promo_name}</h4>
                  {promo.promo_code && (
                    <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full text-sm font-mono mb-2">
                      الكود: {promo.promo_code}
                    </div>
                  )}
                  {promo.discount_value && (
                    <p className="text-primary font-bold">
                      {promo.promo_type === 'percentage' 
                        ? `خصم ${promo.discount_value}%` 
                        : `خصم ${promo.discount_value} ر.س`}
                    </p>
                  )}
                  {promo.terms_conditions && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {promo.terms_conditions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default SDUIBanner;

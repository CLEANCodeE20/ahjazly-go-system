import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { SDUIPage } from "@/components/sdui/SDUIPage";
import { BannerSlider } from "@/components/home/BannerSlider";
import { SDUIHero } from "@/components/sdui/SDUIHero";
import { SDUIFeatures } from "@/components/sdui/SDUIFeatures";
import { SDUIStats } from "@/components/sdui/SDUIStats";
import { SDUICTA } from "@/components/sdui/SDUICTA";
import { usePageComponents, type UIComponent } from "@/hooks/useSDUI";

// Fallback Mock Data in case database is empty
const fallbackComponents: Record<string, UIComponent> = {
  hero: {
    component_id: 1,
    component_type: "hero",
    component_name: "Main Hero",
    title: "الحل المتكامل من أجل",
    subtitle: "المنصة رقم #1 للنقل في المنطقة",
    content: "احجزلي توفر لك أحدث التقنيات لإدارة وتنمية أعمال النقل الخاصة بك. من إدارة الأسطول إلى الحجوزات والمدفوعات، كل ما تحتاجه في منصة واحدة.",
    image_url: null,
    background_image: null,
    link_url: null,
    link_text: null,
    button_text: "ابدأ تجربتك الآن",
    button_url: "/apply",
    button_style: null,
    custom_styles: null,
    custom_data: {
      typed_strings: ["إدارة أسطول النقل بذكاء", "زيادة أرباحك وتوسع نطاق عملك", "تجربة حجز سلسة لعملائك", "أدوات تحليلية متقدمة لقرارات أدق"],
      features: ["تجربة مجانية", "دعم فني 24/7", "تفعيل فوري"],
      secondary_button_text: "تواصل مع المبيعات",
      secondary_button_url: "/contact"
    },
    status: "published",
    start_date: null,
    end_date: null,
    priority: 1,
    click_count: 0,
    view_count: 0,
    created_at: "",
    updated_at: ""
  },
  features: {
    component_id: 2,
    component_type: "features",
    component_name: "Main Features",
    title: "كل ما تحتاجه للنجاح",
    subtitle: null,
    content: "نقدم لك مجموعة متكاملة من الأدوات المصممة خصيصاً لتلبية احتياجات شركات النقل الحديثة",
    image_url: null,
    background_image: null,
    link_url: null,
    link_text: null,
    button_text: null,
    button_url: null,
    button_style: null,
    custom_styles: null,
    custom_data: {
      features: [
        { icon: "globe", title: "نظام حجز مركزي", description: "استقبال الحجوزات من الموقع وتطبيقات الجوال ونقاط البيع في لوحة موحدة." },
        { icon: "smartphone", title: "تطبيقات للجوال", description: "تطبيقات مخصصة للعملاء والسائقين تعمل على أنظمة iOS و Android." },
        { icon: "shield", title: "حماية وأمان", description: "بنية تحتية سحابية آمنة مع نسخ احتياطي دوري وتشفير للبيانات." },
        { icon: "zap", title: "سرعة في الأداء", description: "تقنيات حديثة تضمن سرعة تحميل عالية وتجربة مستخدم سلسة." }
      ]
    },
    status: "published",
    start_date: null,
    end_date: null,
    priority: 2,
    click_count: 0,
    view_count: 0,
    created_at: "",
    updated_at: ""
  }
};

const Index = () => {
  const { data: placements, isLoading } = usePageComponents("home");

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Header />
      <WhatsAppButton />

      <main className="flex-1">
        {/* Dynamic Slider from 'banners' table */}
        <BannerSlider />

        {/* Dynamic Content from SDUI System */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : placements && placements.length > 0 ? (
            <SDUIPage pageKey="home" />
          ) : (
            <>
              <SDUIHero component={fallbackComponents.hero} />
              <SDUIFeatures component={fallbackComponents.features} />
              <div className="py-20 text-center text-muted-foreground bg-muted/20">
                <p>لم يتم إضافة مكونات إضافية للصفحة الرئيسية بعد.</p>
                <p className="text-sm">يمكنك إضافتها من لوحة الإدارة {">"} إدارة الواجهة</p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;



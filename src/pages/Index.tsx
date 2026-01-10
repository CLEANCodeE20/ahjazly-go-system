import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { SDUIHero } from "@/components/sdui/SDUIHero";
import { SDUIFeatures } from "@/components/sdui/SDUIFeatures";
import { SDUIStats } from "@/components/sdui/SDUIStats";
import { SDUICTA } from "@/components/sdui/SDUICTA";
import { UIComponent } from "@/hooks/useSDUI";

// Mock Data matching the original hardcoded content
const heroComponent: UIComponent = {
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
    typed_strings: [
      "إدارة أسطول النقل بذكاء",
      "زيادة أرباحك وتوسع نطاق عملك",
      "تجربة حجز سلسة لعملائك",
      "أدوات تحليلية متقدمة لقرارات أدق"
    ],
    features: [
      "تجربة مجانية",
      "دعم فني 24/7",
      "تفعيل فوري"
    ],
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
};

const featuresComponent: UIComponent = {
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
      {
        icon: "globe",
        title: "نظام حجز مركزي",
        description: "استقبال الحجوزات من الموقع وتطبيقات الجوال ونقاط البيع في لوحة موحدة."
      },
      {
        icon: "smartphone",
        title: "تطبيقات للجوال",
        description: "تطبيقات مخصصة للعملاء والسائقين تعمل على أنظمة iOS و Android."
      },
      {
        icon: "shield",
        title: "حماية وأمان",
        description: "بنية تحتية سحابية آمنة مع نسخ احتياطي دوري وتشفير للبيانات."
      },
      {
        icon: "zap",
        title: "سرعة في الأداء",
        description: "تقنيات حديثة تضمن سرعة تحميل عالية وتجربة مستخدم سلسة."
      },
      {
        icon: "barChart",
        title: "تحليلات متقدمة",
        description: "لوحات معلومات تفاعلية وتقارير دورية تساعدك في اتخاذ القرارات."
      },
      {
        icon: "users",
        title: "إدارة علاقات العملاء",
        description: "أدوات متطورة لإدارة قاعدة بيانات عملائك وتحسين ولائهم."
      }
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
};

const statsComponent: UIComponent = {
  component_id: 3,
  component_type: "stats",
  component_name: "Trust Stats",
  title: null,
  subtitle: null,
  content: null,
  image_url: null,
  background_image: null,
  link_url: null,
  link_text: null,
  button_text: null,
  button_url: null,
  button_style: null,
  custom_styles: null,
  custom_data: {
    stats: [
      { number: "500+", label: "شركة نقل" },
      { number: "100K+", label: "مستخدم نشط" },
      { number: "1M+", label: "حجز ناجح" },
      { number: "99.9%", label: "جاهزية النظام" },
    ]
  },
  status: "published",
  start_date: null,
  end_date: null,
  priority: 3,
  click_count: 0,
  view_count: 0,
  created_at: "",
  updated_at: ""
};

const ctaComponent: UIComponent = {
  component_id: 4,
  component_type: "cta",
  component_name: "Main CTA",
  title: "انتقل بأعمالك إلى المستوى التالي",
  subtitle: null,
  content: "ابدأ رحلة النجاح اليوم مع منصة احجزلي. انضم لأكثر من 500 شركة تثق بنا في إدارة عملياتها.",
  image_url: null,
  background_image: null,
  link_url: null,
  link_text: null,
  button_text: "سجّل شركتك الآن",
  button_url: "/apply",
  button_style: null,
  custom_styles: null,
  custom_data: {
    secondary_button_text: "تحدث مع خبير",
    secondary_button_url: "/contact"
  },
  status: "published",
  start_date: null,
  end_date: null,
  priority: 4,
  click_count: 0,
  view_count: 0,
  created_at: "",
  updated_at: ""
};

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Header />
      <WhatsAppButton />

      <main className="flex-1">
        <SDUIHero component={heroComponent} />
        <SDUIFeatures component={featuresComponent} />
        <SDUIStats component={statsComponent} />
        <SDUICTA component={ctaComponent} />
      </main>

      <Footer />
    </div>
  );
};

export default Index;



import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SDUIPage } from "@/components/sdui/SDUIPage";
import SDUIBanner from "@/components/sdui/SDUIBanner";
import {
  Bus,
  Users,
  CreditCard,
  Shield,
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Route
} from "lucide-react";
const features = [
  {
    icon: Bus,
    title: "إدارة الأسطول",
    description: "أضف وتتبع جميع حافلاتك مع بياناتها الكاملة وحالة الترخيص"
  },
  {
    icon: Route,
    title: "إدارة الرحلات",
    description: "أنشئ مسارات ثابتة وأطلق رحلات جديدة بسهولة تامة"
  },
  {
    icon: Users,
    title: "إدارة الموظفين",
    description: "نظّم فريقك من سائقين ومشرفين وموظفي مبيعات"
  },
  {
    icon: Building2,
    title: "إدارة الفروع",
    description: "أدر جميع فروعك من مكان واحد مع صلاحيات مخصصة"
  },
  {
    icon: CreditCard,
    title: "نظام الحجوزات",
    description: "استقبل الحجوزات وتتبع المدفوعات بنظام متكامل"
  },
  {
    icon: BarChart3,
    title: "تقارير وإحصائيات",
    description: "احصل على رؤية شاملة لأداء شركتك بتقارير مفصلة"
  }
];

const benefits = [
  "واجهة عربية سهلة الاستخدام",
  "دعم فني على مدار الساعة",
  "تحديثات مستمرة ومجانية",
  "حماية وأمان للبيانات",
  "تطبيق جوال للسائقين",
  "تكامل مع بوابات الدفع"
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* SDUI Dynamic Content */}
        <SDUIPage pageKey="home" />

        {/* Fallback/Static Banner if needed */}
        <SDUIBanner page="home" />
      </main>

      <Footer />
    </div>
  );
};

export default Index;

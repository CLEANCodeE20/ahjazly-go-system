import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
    Bus,
    MapPin,
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

const Features = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />



            {/* Features Section */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            كل ما تحتاجه في منصة واحدة
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            نوفر لك أدوات متكاملة لإدارة جميع جوانب شركة النقل الخاصة بك
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-elegant"
                            >
                                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 md:py-24 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                                لماذا تختار منصة احجزلي؟
                            </h2>
                            <p className="text-muted-foreground text-lg mb-8">
                                نحن نفهم احتياجات شركات النقل في المنطقة العربية ونقدم حلولاً مصممة خصيصاً لتلبية هذه الاحتياجات
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                                        <span className="text-foreground">{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            <Button variant="default" size="lg" className="mt-8" asChild>
                                <Link to="/apply">انضم إلينا الآن</Link>
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="aspect-square rounded-3xl gradient-primary p-8 flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                    <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 text-center animate-float">
                                        <div className="text-3xl font-bold text-primary-foreground">500+</div>
                                        <div className="text-primary-foreground/70 text-sm">شركة مسجلة</div>
                                    </div>
                                    <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 text-center animate-float" style={{ animationDelay: '1s' }}>
                                        <div className="text-3xl font-bold text-primary-foreground">10K+</div>
                                        <div className="text-primary-foreground/70 text-sm">رحلة شهرياً</div>
                                    </div>
                                    <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 text-center animate-float" style={{ animationDelay: '2s' }}>
                                        <div className="text-3xl font-bold text-primary-foreground">50K+</div>
                                        <div className="text-primary-foreground/70 text-sm">حجز ناجح</div>
                                    </div>
                                    <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-4 text-center animate-float" style={{ animationDelay: '3s' }}>
                                        <div className="text-3xl font-bold text-primary-foreground">99%</div>
                                        <div className="text-primary-foreground/70 text-sm">رضا العملاء</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center bg-card rounded-3xl p-8 md:p-12 border border-border shadow-elegant">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            جاهز للبدء؟
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            انضم إلى مئات الشركات التي تثق بمنصة احجزلي لإدارة أعمالها
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="hero" size="xl" asChild>
                                <Link to="/apply" className="flex items-center gap-2">
                                    قدّم طلب الانضمام
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="xl" asChild>
                                <Link to="/contact">تواصل معنا</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Features;

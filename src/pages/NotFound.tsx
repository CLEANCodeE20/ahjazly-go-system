import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60" dir="rtl">
      <div className="text-center px-4 max-w-2xl">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-black text-muted-foreground/10 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          عذراً، الصفحة غير موجودة
        </h2>
        <p className="text-lg text-muted-foreground mb-2">
          الصفحة التي تبحث عنها غير متوفرة أو تم نقلها
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8 font-mono bg-muted/50 px-4 py-2 rounded-lg inline-block">
          {location.pathname}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" asChild className="gap-2">
            <Link to="/">
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowRight className="w-5 h-5" />
            الرجوع للخلف
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">صفحات قد تهمك:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/" className="text-sm text-primary hover:underline">الرئيسية</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/about" className="text-sm text-primary hover:underline">من نحن</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/contact" className="text-sm text-primary hover:underline">اتصل بنا</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/apply" className="text-sm text-primary hover:underline">انضم كشريك</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

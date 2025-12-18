import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bus, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">احجزلي</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              الرئيسية
            </Link>
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              المميزات
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              عن المنصة
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              تواصل معنا
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">تسجيل الدخول</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/apply">انضم كشركة</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                الرئيسية
              </Link>
              <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                المميزات
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                عن المنصة
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                تواصل معنا
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link to="/apply">انضم كشركة</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

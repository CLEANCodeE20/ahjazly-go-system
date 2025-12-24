import { Link } from "react-router-dom";
import { Bus, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Bus className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">احجزلي</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              منصة متكاملة لإدارة شركات النقل والمواصلات، نساعدك على تنظيم أسطولك ورحلاتك بكفاءة عالية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  المميزات
                </Link>
              </li>
              <li>
                <Link to="/apply" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  انضم كشركة
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">الدعم</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm">
                  سياسة الخصوصية
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Mail className="w-4 h-4" />
                <span>info@ehgezly.com</span>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Phone className="w-4 h-4" />
                <span>+967 712159295</span>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <MapPin className="w-4 h-4" />
                <span>,تعز الجمهرية اليمنية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} احجزلي. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { MessageCircle } from "lucide-react";

export const WhatsAppButton = () => {
    const phoneNumber = "966500000000"; // يمكنك تغيير الرقم لاحقاً
    const message = "مرحباً، أحتاج إلى استفسار بخصوص منصة أحجزلي";

    const handleClick = () => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    return (
        <div className="fixed bottom-6 left-6 z-[100] group">
            <button
                onClick={handleClick}
                className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 group-hover:shadow-[0_0_20px_rgba(37,211,102,0.6)]"
                aria-label="تواصل معنا عبر واتساب"
            >
                {/* Ping Animation */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25"></span>

                <MessageCircle className="w-8 h-8 relative z-10" />

                {/* Tooltip */}
                <div className="absolute right-full mr-4 px-3 py-1 bg-card border border-border rounded-lg text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-elegant">
                    تواصل مع الدعم الفني
                </div>
            </button>
        </div>
    );
};

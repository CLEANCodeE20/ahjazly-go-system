import { forwardRef } from "react";
import { Bus, MapPin, Calendar, Clock, User, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

interface TicketPrintProps {
    booking: {
        booking_id: number;
        total_price: number;
        booking_date: string;
        payment_method: string | null;
        payment_status: string | null;
    };
    passenger: {
        full_name: string;
        phone_number: string | null;
        id_number?: string | null;
        seat_number?: string | null;
        gender?: string | null;
    };
    trip: {
        origin: string;
        destination: string;
        date: string;
        time: string;
    };
    companyName?: string;
    logoUrl?: string;
}

const TicketPrint = forwardRef<HTMLDivElement, TicketPrintProps>(
    ({ booking, passenger, trip, companyName = "احجزلي", logoUrl }, ref) => {
        const isPaid = booking.payment_status === 'paid';
        const ticketNumber = `BK-${booking.booking_id.toString().padStart(6, '0')}`;
        
        return (
            <div 
                ref={ref} 
                className="bg-white max-w-[400px] mx-auto shadow-xl font-cairo print:shadow-none" 
                dir="rtl"
                style={{ fontFamily: 'Cairo, Noto Sans Arabic, Arial, sans-serif' }}
            >
                {/* === Header Section === */}
                <div className="bg-gradient-to-l from-blue-700 to-blue-600 text-white px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border-2 border-white/30 overflow-hidden">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Bus className="w-7 h-7 text-white" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">{companyName}</h1>
                                <p className="text-[10px] text-blue-100 font-semibold uppercase tracking-widest">تذكرة سفر إلكترونية</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-blue-200 font-bold">تاريخ الحجز</p>
                            <p className="text-sm font-bold">{new Date(booking.booking_date).toLocaleDateString('ar-SA')}</p>
                        </div>
                    </div>
                </div>
                
                {/* === Ticket Number & Seat Badge === */}
                <div className="px-6 py-4 border-b-2 border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center">
                        <div className="bg-blue-700 text-white rounded-lg px-4 py-2">
                            <p className="text-[9px] font-bold text-blue-200 mb-0.5">رقم التذكرة</p>
                            <p className="text-lg font-black tracking-tight">{ticketNumber}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 mb-1">رقم المقعد</p>
                            <div className="bg-blue-100 text-blue-700 rounded-xl px-4 py-2">
                                <p className="text-3xl font-black">{passenger.seat_number || 'A1'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* === Route Card === */}
                <div className="px-6 py-5">
                    <div className="bg-gradient-to-l from-gray-50 to-white rounded-2xl p-5 border border-gray-100 relative">
                        <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-600 rounded-r-full" />
                        
                        <div className="flex items-center justify-between">
                            {/* Origin */}
                            <div className="flex-1 text-right pr-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">من</span>
                                </div>
                                <p className="text-lg font-black text-gray-900 leading-tight">{trip.origin}</p>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex flex-col items-center px-4">
                                <div className="w-12 h-0.5 bg-gray-300 relative">
                                    <Bus className="w-5 h-5 text-blue-600 absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-1" />
                                </div>
                            </div>
                            
                            {/* Destination */}
                            <div className="flex-1 text-left pl-3">
                                <div className="flex items-center gap-1.5 mb-1 justify-end">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">إلى</span>
                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                </div>
                                <p className="text-lg font-black text-gray-900 leading-tight">{trip.destination}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* === Date & Time Grid === */}
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black text-gray-500 uppercase">التاريخ</span>
                            </div>
                            <p className="text-base font-black text-gray-900">{trip.date}</p>
                        </div>
                        <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black text-gray-500 uppercase">الوقت</span>
                            </div>
                            <p className="text-base font-black text-gray-900">{trip.time}</p>
                        </div>
                    </div>
                </div>
                
                {/* === Passenger Details === */}
                <div className="px-6 pb-4">
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-black text-gray-900">بيانات المسافر</span>
                        </div>
                        <div className="p-4 space-y-3 bg-white">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400">الاسم الكامل:</span>
                                <span className="text-sm font-black text-gray-900">{passenger.full_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400">رقم الهوية:</span>
                                <span className="text-sm font-mono font-bold text-gray-700" dir="ltr">{passenger.id_number || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400">الجنس:</span>
                                <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded">
                                    {passenger.gender === 'male' ? 'ذكر' : passenger.gender === 'female' ? 'أنثى' : 'غير محدد'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400">رقم الجوال:</span>
                                <span className="text-sm font-bold text-gray-900" dir="ltr">{passenger.phone_number || '---'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* === Payment Section === */}
                <div className="px-6 pb-4">
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-black text-gray-900">تفاصيل الدفع</span>
                        </div>
                        <div className="p-4 space-y-3 bg-white">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400">إجمالي المبلغ:</span>
                                <span className="text-xl font-black text-emerald-600">{booking.total_price} ر.س</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400">حالة الدفع:</span>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${
                                    isPaid 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-orange-100 text-orange-700'
                                }`}>
                                    {isPaid ? (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    ) : (
                                        <AlertCircle className="w-3.5 h-3.5" />
                                    )}
                                    {isPaid ? 'مدفوع بالكامل' : 'بانتظار التحصيل'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* === QR Code & Verification Footer === */}
                <div className="px-6 pb-6">
                    <div className="border-t-2 border-dashed border-gray-200 pt-5">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                    <p className="text-[11px] font-black text-gray-900 uppercase">التحقق الرقمي</p>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                    يرجى إبراز هذه التذكرة عند صعود الحافلة. التذكرة صالحة فقط للرحلة المذكورة أعلاه.
                                </p>
                            </div>
                            <div className="shrink-0 p-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticketNumber}-SEAT-${passenger.seat_number}`}
                                    alt="QR Code"
                                    className="w-20 h-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* === Footer === */}
                <div className="bg-gray-100 text-center py-3 border-t border-gray-200">
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        POWERED BY AHJAZLY GO SYSTEM • VERSION 2.0
                    </p>
                </div>
            </div>
        );
    }
);

TicketPrint.displayName = "TicketPrint";

export default TicketPrint;

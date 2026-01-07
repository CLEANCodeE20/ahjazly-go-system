import { forwardRef } from "react";
import { Bus, MapPin, Calendar, Clock, User, Phone, Ticket, CreditCard } from "lucide-react";

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
    return (
      <div ref={ref} className="bg-white p-6 max-w-md mx-auto shadow-2xl rounded-3xl border border-gray-100 font-sans relative overflow-hidden" dir="rtl">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-full -ml-12 -mb-12 opacity-50" />

        {/* Header */}
        <div className="relative flex justify-between items-start mb-6 border-b-2 border-dashed border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white overflow-hidden shadow-lg border-2 border-white">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Bus className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{companyName}</h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">تذكرة إلكترونية رسمية</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-400 font-bold">تاريخ الحجز</p>
            <p className="text-xs font-bold text-gray-700">{new Date(booking.booking_date).toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        {/* Ticket Header Section */}
        <div className="relative mb-6">
          <div className="flex justify-between items-end">
            <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 shadow-md">
              <span className="text-[10px] block font-bold opacity-80 mb-0.5 text-center">رقم التذكرة</span>
              <p className="text-xl font-black tracking-tight">BK-{booking.booking_id.toString().padStart(6, '0')}</p>
            </div>
            <div className="text-left">
              <span className="text-[10px] block font-bold text-gray-400 mb-0.5">رقم المقعد</span>
              <p className="text-3xl font-black text-blue-600 leading-none">{passenger.seat_number || 'A1'}</p>
            </div>
          </div>
        </div>

        {/* Route Info Card */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-600" />
          <div className="flex items-center justify-between relative z-10">
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">من</span>
              </div>
              <p className="text-xl font-black text-gray-900">{trip.origin}</p>
            </div>

            <div className="flex flex-col items-center px-4">
              <div className="w-16 h-px bg-gray-300 relative">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-600 shadow-sm" />
                <Bus className="w-4 h-4 text-blue-600 absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-50 px-0.5" />
              </div>
            </div>

            <div className="text-left">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">إلى</span>
                <MapPin className="w-3 h-3 text-red-500" />
              </div>
              <p className="text-xl font-black text-gray-900">{trip.destination}</p>
            </div>
          </div>
        </div>

        {/* Time and Date Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50/50 rounded-2xl p-4 text-right border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-black text-gray-400 uppercase">التاريخ</span>
            </div>
            <p className="text-lg font-black text-gray-900">{trip.date}</p>
          </div>
          <div className="bg-blue-50/50 rounded-2xl p-4 text-right border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-black text-gray-400 uppercase">الوقت</span>
            </div>
            <p className="text-lg font-black text-gray-900">{trip.time}</p>
          </div>
        </div>

        {/* Main Details Section */}
        <div className="space-y-4">
          {/* Passenger Data */}
          <div className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black text-gray-900">بيانات المسافر</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400">الاسم الكامل:</span>
                <span className="text-sm font-black text-gray-900">{passenger.full_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400">رقم الهوية:</span>
                <span className="text-sm font-bold font-mono text-gray-700">{passenger.id_number || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400">الجنس:</span>
                <span className="text-sm font-bold border rounded-md px-2 py-0.5 border-gray-200">
                  {passenger.gender === 'male' ? 'ذكر' : passenger.gender === 'female' ? 'أنثى' : 'غير محدد'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400">رقم التواصل:</span>
                <span className="text-sm font-bold text-gray-900" dir="ltr">{passenger.phone_number}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              <span className="text-xs font-black text-gray-900">تفاصيل الحساب</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400">إجمالي المبلغ:</span>
                <span className="text-lg font-black text-green-600">{booking.total_price} ر.س</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-400">حالة الدفع:</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${booking.payment_status === 'paid' ? 'bg-green-600 animate-pulse' : 'bg-orange-600'}`} />
                  {booking.payment_status === 'paid' ? 'مدفوع بالكامل' : 'بانتظار التحصيل'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div className="mt-8 border-t-2 border-dashed border-gray-100 pt-6">
          <div className="flex items-center gap-6">
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter">التحقق الرقمي</p>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                يرجى إبراز هذه التذكرة عند الصعود للحافلة. التذكرة صالحة فقط للرحلة المذكورة أعلاه.
              </p>
            </div>
            <div className="flex-shrink-0 relative group">
              <div className="absolute -inset-1 bg-blue-100 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BK-${booking.booking_id}-P-${passenger.seat_number}`}
                  alt="Ticket Authentication QR"
                  className="w-20 h-20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Trademarks */}
        <div className="text-center mt-6">
          <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.2em]">POWERED BY AHJAZLY GO SYSTEM • VERSION 2.0</p>
        </div>
      </div>
    );
  }
);

TicketPrint.displayName = "TicketPrint";

export default TicketPrint;

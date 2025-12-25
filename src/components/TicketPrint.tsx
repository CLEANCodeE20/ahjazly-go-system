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
    name: string;
    phone: string;
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
      <div ref={ref} className="bg-white p-6 max-w-md mx-auto shadow-lg rounded-2xl border-2 border-gray-100 font-sans" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white overflow-hidden shadow-md">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Bus className="w-7 h-7" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">{companyName}</h2>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Official E-Ticket</p>
            </div>
          </div>
        </div>

        {/* Ticket Number */}
        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Ticket className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">رقم التذكرة</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            BK-{booking.booking_id.toString().padStart(5, '0')}
          </p>
        </div>

        {/* Route Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <MapPin className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">من</p>
              <p className="font-bold text-gray-800">{trip.origin}</p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-16 border-t-2 border-dashed border-gray-400 relative">
                <Bus className="w-4 h-4 text-gray-400 absolute -top-2 left-1/2 -translate-x-1/2 bg-gray-50" />
              </div>
            </div>
            <div className="text-center flex-1">
              <MapPin className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-sm text-gray-500">إلى</p>
              <p className="font-bold text-gray-800">{trip.destination}</p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-sm text-gray-500">تاريخ الرحلة</p>
            <p className="font-bold text-gray-800">{trip.date}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-sm text-gray-500">وقت المغادرة</p>
            <p className="font-bold text-gray-800">{trip.time}</p>
          </div>
        </div>

        {/* Passenger Info */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            بيانات المسافر
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">الاسم:</span>
              <span className="font-medium text-gray-800">{passenger.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                الجوال:
              </span>
              <span className="font-medium text-gray-800" dir="ltr">{passenger.phone}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            تفاصيل الدفع
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">المبلغ:</span>
              <span className="font-bold text-green-600 text-lg">{booking.total_price} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">طريقة الدفع:</span>
              <span className="font-medium text-gray-800">
                {booking.payment_method === 'cash' ? 'نقداً' :
                  booking.payment_method === 'card' ? 'بطاقة ائتمان' :
                    booking.payment_method === 'stc_pay' ? 'STC Pay' :
                      booking.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'محفظة'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الحالة:</span>
              <span className={`font-medium ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {booking.payment_status === 'paid' ? 'مدفوع' : 'في انتظار الدفع'}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code and Verification */}
        <div className="text-center border-t-2 border-dashed border-gray-300 pt-6 mt-6">
          <div className="inline-block p-2 bg-white border-2 border-gray-100 rounded-xl mb-2 shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=BK-${booking.booking_id}`}
              alt="QR Code"
              className="w-24 h-24"
            />
          </div>
          <p className="text-[10px] text-gray-500 font-medium">امسح الكود للتحقق من صحة التذكرة عبر تطبيق احجزلي</p>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">تاريخ الحجز: {new Date(booking.booking_date).toLocaleDateString('ar-SA')}</p>
          <p className="text-xs text-gray-400 mt-2">نتمنى لكم رحلة سعيدة</p>
        </div>
      </div>
    );
  }
);

TicketPrint.displayName = "TicketPrint";

export default TicketPrint;

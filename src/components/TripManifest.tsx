import { forwardRef } from "react";
import { Bus, MapPin, Calendar, Clock, Users, FileText, Phone, Hash } from "lucide-react";

interface ManifestProps {
    trip: {
        trip_id: number;
        origin: string;
        destination: string;
        date: string;
        time: string;
        bus: string;
        driver: string;
    };
    passengers: Array<{
        name: string;
        phone: string;
        seat_number: string | number;
        status: string;
        payment: string;
        id_number?: string;
    }>;
    companyName?: string;
    logoUrl?: string;
}

const TripManifest = forwardRef<HTMLDivElement, ManifestProps>(
    ({ trip, passengers, companyName = "احجزلي", logoUrl }, ref) => {
        const confirmedPassengers = passengers.filter(p => p.status === 'confirmed');
        const pendingPassengers = passengers.filter(p => p.status !== 'confirmed');
        
        return (
            <div 
                ref={ref} 
                className="bg-white p-8 max-w-4xl mx-auto font-cairo print:p-6" 
                dir="rtl"
                style={{ fontFamily: 'Cairo, Noto Sans Arabic, Arial, sans-serif' }}
            >
                {/* === Header === */}
                <div className="flex justify-between items-start pb-6 mb-6 border-b-2 border-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-200 shrink-0 print:border print:border-gray-300">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Bus className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-6 h-6 text-blue-700" />
                                <h1 className="text-2xl font-black text-gray-900">كشف ركاب الرحلة</h1>
                            </div>
                            <p className="text-lg text-gray-600 font-bold">{companyName}</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="text-xl font-mono font-bold text-blue-700">TRIP-{trip.trip_id}</span>
                            <Hash className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
                    </div>
                </div>
                
                {/* === Trip Details Grid === */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 print:bg-white print:border-gray-300">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-gray-500 uppercase font-bold">المسار</p>
                        </div>
                        <p className="font-black text-gray-900 text-sm">
                            {trip.origin} <span className="text-gray-400">←</span> {trip.destination}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-gray-500 uppercase font-bold">الموعد</p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{trip.date}</p>
                        <p className="text-xs text-gray-500">{trip.time}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Bus className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-gray-500 uppercase font-bold">الحافلة</p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{trip.bus || 'غير محدد'}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-gray-500 uppercase font-bold">السائق</p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{trip.driver || 'غير محدد'}</p>
                    </div>
                </div>
                
                {/* === Passengers Table === */}
                <div className="border border-gray-300 rounded-lg overflow-hidden mb-8 print:border-gray-400">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="bg-gray-900 text-white print:bg-gray-800">
                                <th className="py-3 px-3 font-bold border-l border-gray-700 w-12 text-center">م</th>
                                <th className="py-3 px-3 font-bold border-l border-gray-700">اسم المسافر</th>
                                <th className="py-3 px-3 font-bold border-l border-gray-700 w-28">رقم الهوية</th>
                                <th className="py-3 px-3 font-bold border-l border-gray-700 w-32">رقم الجوال</th>
                                <th className="py-3 px-3 font-bold border-l border-gray-700 w-16 text-center">المقعد</th>
                                <th className="py-3 px-3 font-bold border-l border-gray-700 w-24 text-center">الحالة</th>
                                <th className="py-3 px-3 font-bold w-20 text-center">التوقيع</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {passengers.length > 0 ? (
                                passengers.map((p, index) => (
                                    <tr 
                                        key={index} 
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} print:bg-white`}
                                    >
                                        <td className="py-3 px-3 font-bold border-l border-gray-200 text-center text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-3 font-black border-l border-gray-200 text-gray-900">
                                            {p.name}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-xs border-l border-gray-200 text-gray-600" dir="ltr">
                                            {p.id_number || '---'}
                                        </td>
                                        <td className="py-3 px-3 font-mono text-xs border-l border-gray-200" dir="ltr">
                                            {p.phone || '---'}
                                        </td>
                                        <td className="py-3 px-3 font-black border-l border-gray-200 text-center text-blue-700">
                                            {p.seat_number}
                                        </td>
                                        <td className="py-3 px-3 border-l border-gray-200 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                p.status === 'confirmed' 
                                                    ? 'bg-emerald-100 text-emerald-800 print:bg-emerald-50' 
                                                    : 'bg-orange-100 text-orange-800 print:bg-orange-50'
                                            }`}>
                                                {p.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 border-l border-gray-200">
                                            {/* Empty cell for manual signature */}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                                        لا يوجد حجوزات لهذه الرحلة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* === Summary Stats === */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center print:bg-white">
                        <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الركاب</p>
                        <p className="text-3xl font-black text-blue-700">{passengers.length}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center print:bg-white">
                        <p className="text-xs text-gray-500 font-bold mb-1">مؤكد / مدفوع</p>
                        <p className="text-3xl font-black text-emerald-700">{confirmedPassengers.length}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-center print:bg-white">
                        <p className="text-xs text-gray-500 font-bold mb-1">قيد الانتظار</p>
                        <p className="text-3xl font-black text-orange-700">{pendingPassengers.length}</p>
                    </div>
                </div>
                
                {/* === Signatures Section === */}
                <div className="flex justify-between items-end pt-8 border-t border-gray-200">
                    <div className="text-center">
                        <div className="h-16 w-36 border-b-2 border-gray-400 mb-2" />
                        <p className="text-xs font-bold text-gray-500">توقيع السائق</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 w-36 border-b-2 border-gray-400 mb-2" />
                        <p className="text-xs font-bold text-gray-500">توقيع المشرف</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 w-36 border-b-2 border-gray-400 mb-2 flex items-end justify-center">
                            <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg mb-1" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">ختم الشركة</p>
                    </div>
                </div>
                
                {/* === Footer === */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                        هذا التقرير تم إنتاجه آلياً عبر منظومة احجزلي • AHJAZLY GO SYSTEM 2024
                    </p>
                </div>
            </div>
        );
    }
);

TripManifest.displayName = "TripManifest";

export default TripManifest;

import { forwardRef } from "react";
import { Bus, MapPin, Calendar, Clock, User, Phone, Printer, Users } from "lucide-react";

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
    }>;
    companyName?: string;
    logoUrl?: string;
}

const TripManifest = forwardRef<HTMLDivElement, ManifestProps>(
    ({ trip, passengers, companyName = "احجزلي", logoUrl }, ref) => {
        return (
            <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-gray-800" dir="rtl">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Bus className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 mb-1">كشف ركاب الرحلة</h1>
                            <p className="text-lg text-gray-600 font-bold">{companyName}</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="text-2xl font-mono font-bold text-blue-700">TRIP-{trip.trip_id}</span>
                            <Bus className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
                    </div>
                </div>

                {/* Trip Details Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">المسار</p>
                        <p className="font-black text-gray-900 flex items-center gap-1">
                            {trip.origin} <span className="text-gray-400 text-xs">➔</span> {trip.destination}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">الموعد</p>
                        <p className="font-bold text-gray-900">{trip.date} - {trip.time}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">الحافلة</p>
                        <p className="font-bold text-gray-900">{trip.bus}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">السائق</p>
                        <p className="font-bold text-gray-900">{trip.driver}</p>
                    </div>
                </div>

                {/* Passengers Table */}
                <div className="border border-gray-300 rounded-lg overflow-hidden mb-8">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <th className="py-3 px-4 font-bold border-l border-gray-700 w-16">م</th>
                                <th className="py-3 px-4 font-bold border-l border-gray-700">اسم المسافر</th>
                                <th className="py-3 px-4 font-bold border-l border-gray-700">رقم الجوال</th>
                                <th className="py-3 px-4 font-bold border-l border-gray-700">رقم المقعد</th>
                                <th className="py-3 px-4 font-bold border-l border-gray-700">حالة الحجز</th>
                                <th className="py-3 px-4 font-bold">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {passengers.length > 0 ? (
                                passengers.map((p, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}>
                                        <td className="py-3 px-4 font-bold border-l border-gray-300 text-center">{index + 1}</td>
                                        <td className="py-3 px-4 font-black border-l border-gray-300">{p.name}</td>
                                        <td className="py-3 px-4 font-mono border-l border-gray-300" dir="ltr">{p.phone}</td>
                                        <td className="py-3 px-4 font-black border-l border-gray-300 text-center">{p.seat_number}</td>
                                        <td className="py-3 px-4 border-l border-gray-300">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {p.status === 'confirmed' ? 'مؤكد/مدفوع' : 'قيد الانتظار'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4"></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">لا يوجد حجوزات مؤكدة لهذه الرحلة بعد</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary and Signatures */}
                <div className="flex justify-between items-end mt-12">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-900 font-bold">إجمالي الركاب:</span>
                            <span className="text-xl font-black text-blue-700">{passengers.length}</span>
                        </div>
                        <p className="text-[10px] text-blue-600">هذا التقرير تم إنتاجه عبر منصة احجزلي 2024</p>
                    </div>

                    <div className="flex gap-12">
                        <div className="text-center w-32">
                            <div className="h-16 w-full border-b border-gray-400 mb-2"></div>
                            <p className="text-xs font-bold text-gray-500">توقيع السائق</p>
                        </div>
                        <div className="text-center w-32">
                            <div className="h-16 w-full border-b border-gray-400 mb-2"></div>
                            <p className="text-xs font-bold text-gray-500">ختم الشركة</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

TripManifest.displayName = "TripManifest";

export default TripManifest;

import React from 'react';
import { ArabicFormatter } from '@/utils/formatters/ArabicFormatter';
import '@/styles/reports/base.css';
import '@/styles/reports/print.css';
import './PartnerStatement/PartnerStatement.css'; // Reusing the same styles

interface TripsReportProps {
    data: {
        generatedDate: Date;
        partner: {
            name: string;
            companyName: string;
            logoUrl: string | null;
        };
        trips: Array<{
            trip_id: number;
            route: string;
            departure: string;
            bus: string;
            busCapacity: number;
            driver: string;
            price: number;
            status: string;
            metrics: {
                confirmed_bookings: number;
                cancelled_bookings: number;
                collected_revenue: number;
            };
        }>;
    };
}

export const TripsReport: React.FC<TripsReportProps> = ({ data }) => {
    // Calculate totals for summary
    const totalRevenue = data.trips.reduce((sum, t) => sum + (t.metrics?.collected_revenue || 0), 0);
    const totalBookings = data.trips.reduce((sum, t) => sum + (t.metrics?.confirmed_bookings || 0), 0);
    const totalCapacity = data.trips.reduce((sum, t) => sum + (t.busCapacity || 0), 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

    return (
        <div className="report-container partner-statement hidden-on-screen visible-on-print" dir="rtl">
            {/* Professional Header */}
            <header className="statement-header flex justify-between items-start mb-8 border-b-2 border-primary pb-4">
                <div className="company-section flex items-center gap-4">
                    {data.partner.logoUrl && (
                        <img src={data.partner.logoUrl} alt="Company Logo" className="w-20 h-20 object-contain rounded-full border border-gray-200" />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{data.partner.companyName}</h1>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>{data.partner.name}</p>
                            <p>تقرير عمليات الرحلات التفصيلي</p>
                        </div>
                    </div>
                </div>
                <div className="report-meta text-left">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">سجل الحركة والتشغيل</h2>
                    <div className="text-sm text-gray-600">
                        <p><strong>رقم التقرير:</strong> {Math.floor(Math.random() * 100000)}</p>
                        <p><strong>تاريخ الإصدار:</strong> {ArabicFormatter.formatDate(data.generatedDate)}</p>
                        <p><strong>وقت الإصدار:</strong> {data.generatedDate.toLocaleTimeString('ar-SA')}</p>
                    </div>
                </div>
            </header>

            {/* Executive Summary */}
            <div className="grid grid-cols-5 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-center border-l border-gray-200 pl-4">
                    <div className="text-xs text-gray-500 mb-1">إجمالي الرحلات</div>
                    <div className="text-xl font-bold text-gray-800">{data.trips.length}</div>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                    <div className="text-xs text-gray-500 mb-1">إجمالي الحجوزات</div>
                    <div className="text-xl font-bold text-blue-600">{totalBookings}</div>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                    <div className="text-xs text-gray-500 mb-1">متوسط الإشغال</div>
                    <div className="text-xl font-bold text-purple-600">{occupancyRate}%</div>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                    <div className="text-xs text-gray-500 mb-1">الإيرادات المحصلة</div>
                    <div className="text-xl font-bold text-green-600">{ArabicFormatter.formatCurrency(totalRevenue)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">حالة التشغيل</div>
                    <div className="text-sm font-medium">
                        <span className="text-green-600">{data.trips.filter(t => t.status === 'completed').length} مكتملة</span>
                        <span className="mx-2">|</span>
                        <span className="text-blue-600">{data.trips.filter(t => t.status === 'scheduled').length} مجدولة</span>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <section className="transactions-section mb-8">
                <table className="w-full text-right border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="p-2 font-bold text-gray-700 w-12">#</th>
                            <th className="p-2 font-bold text-gray-700">المسار</th>
                            <th className="p-2 font-bold text-gray-700">التاريخ</th>
                            <th className="p-2 font-bold text-gray-700">المركبة / السائق</th>
                            <th className="p-2 font-bold text-gray-700 w-20 text-center">المقاعد</th>
                            <th className="p-2 font-bold text-gray-700 w-20 text-center">الحجوزات</th>
                            <th className="p-2 font-bold text-gray-700 w-24 text-center">نسبة الإشغال</th>
                            <th className="p-2 font-bold text-gray-700 w-24">الإيراد</th>
                            <th className="p-2 font-bold text-gray-700 w-20 text-center">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.trips.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-500 border border-gray-200">
                                    لا توجد بيانات للعرض في الفترة المحددة
                                </td>
                            </tr>
                        ) : (
                            data.trips.map((trip) => {
                                const bookings = trip.metrics?.confirmed_bookings || 0;
                                const capacity = trip.busCapacity || 0;
                                const occupancy = capacity > 0 ? Math.round((bookings / capacity) * 100) : 0;
                                const revenue = trip.metrics?.collected_revenue || 0;

                                return (
                                    <tr key={trip.trip_id} className="border-b border-gray-200 hover:bg-gray-50 break-inside-avoid">
                                        <td className="p-2 font-mono">{trip.trip_id}</td>
                                        <td className="p-2 font-medium">{trip.route}</td>
                                        <td className="p-2">
                                            <div className="font-semibold">{ArabicFormatter.formatDate(new Date(trip.departure))}</div>
                                            <div className="text-gray-500 text-[10px]" dir="ltr">
                                                {new Date(trip.departure).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="font-medium">{trip.bus}</div>
                                            <div className="text-gray-500 text-[10px]">{trip.driver}</div>
                                        </td>
                                        <td className="p-2 text-center text-gray-600">{capacity}</td>
                                        <td className="p-2 text-center font-medium">{bookings}</td>
                                        <td className="p-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className={`text-[10px] font-bold ${occupancy >= 80 ? 'text-green-600' :
                                                    occupancy >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {occupancy}%
                                                </span>
                                                <div className="w-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${occupancy >= 80 ? 'bg-green-500' :
                                                            occupancy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2 font-bold text-gray-800">{String(revenue.toLocaleString())} ر.س</td>
                                        <td className="p-2 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${trip.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                trip.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    trip.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        trip.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                {trip.status === 'scheduled' ? 'مجدولة' :
                                                    trip.status === 'in_progress' ? 'جارية' :
                                                        trip.status === 'completed' ? 'مكتملة' :
                                                            trip.status === 'cancelled' ? 'ملغية' : trip.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </section>

            {/* Footer with Signatures */}
            <footer className="mt-12 border-t border-gray-300 pt-6 break-inside-avoid">
                <div className="grid grid-cols-3 gap-8 mb-8">
                    <div className="text-center">
                        <p className="font-bold mb-12">مسؤول العمليات</p>
                        <div className="h-px bg-gray-300 w-3/4 mx-auto"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-12">المدير المالي</p>
                        <div className="h-px bg-gray-300 w-3/4 mx-auto"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-12">الاعتماد</p>
                        <div className="h-px bg-gray-300 w-3/4 mx-auto"></div>
                    </div>
                </div>

            </footer>

            {/* Fixed Page Footer */}
            <div className="page-footer flex justify-between items-center text-xs text-gray-500 border-t border-gray-300 pt-2 px-4 bg-white w-full">
                <p>تم استخراج هذا التقرير من نظام "احجزلي" لإدارة النقل البري</p>
                <div className="flex gap-4">
                    <p>الصفحة <span className="page-number"></span></p>
                    <p dir="ltr">{new Date().toLocaleString('ar-SA')}</p>
                </div>
            </div>
        </div>
    );
};

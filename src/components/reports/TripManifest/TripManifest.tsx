/**
 * تقرير الرحلة (Trip Manifest)
 * يعرض قائمة الركاب والمقاعد المحجوزة للرحلة
 */

import React from 'react';
import { ArabicFormatter } from '@/utils/formatters/ArabicFormatter';
import '@/styles/reports/base.css';
import '@/styles/reports/print.css';
import './TripManifest.css';

export interface ManifestPassenger {
    seatNumber: string;
    passengerName: string;
    nationalId: string;
    phone: string;
    bookingId: string;
    ticketNumber: string;
    boardingStatus?: 'boarded' | 'no-show' | 'pending';
}

export interface TripManifestData {
    // معلومات الرحلة
    tripNumber: string;
    tripDate: Date;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;

    // معلومات الحافلة
    busNumber: string;
    busType: string;
    totalSeats: number;

    // معلومات السائق
    driverName: string;
    driverPhone: string;
    driverLicense: string;

    // الركاب
    passengers: ManifestPassenger[];

    // الإحصائيات
    bookedSeats: number;
    availableSeats: number;
    revenue: number;

    // الشركة
    company: {
        name: string;
        logo?: string;
    };
}

interface TripManifestProps {
    data: TripManifestData;
    showPrintButton?: boolean;
}

export const TripManifest: React.FC<TripManifestProps> = ({
    data,
    showPrintButton = true,
}) => {
    const handlePrint = () => {
        window.print();
    };

    const getBoardingBadge = (status?: string) => {
        const badges = {
            boarded: { text: 'صعد', class: 'status-success' },
            'no-show': { text: 'لم يحضر', class: 'status-danger' },
            pending: { text: 'قيد الانتظار', class: 'status-warning' },
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    const occupancyRate = ((data.bookedSeats / data.totalSeats) * 100).toFixed(1);

    return (
        <div className="trip-manifest-wrapper">
            {showPrintButton && (
                <div className="report-actions no-print">
                    <button onClick={handlePrint} className="btn btn-primary">
                        🖨️ طباعة كشف الركاب
                    </button>
                </div>
            )}

            <div className="report-container trip-manifest">
                {/* الرأس */}
                <header className="manifest-header">
                    <div className="company-section">
                        {data.company.logo && (
                            <img src={data.company.logo} alt={data.company.name} className="logo" />
                        )}
                        <h1 className="company-name">{data.company.name}</h1>
                    </div>
                    <div className="manifest-info">
                        <h2 className="manifest-title">كشف ركاب الرحلة</h2>
                        <p className="trip-number">رقم الرحلة: {data.tripNumber}</p>
                    </div>
                </header>

                <hr className="divider" />

                {/* معلومات الرحلة */}
                <section className="trip-info-section">
                    <div className="trip-route">
                        <div className="route-point from">
                            <div className="route-label">من</div>
                            <div className="route-city">{data.from}</div>
                            <div className="route-time number">{data.departureTime}</div>
                        </div>
                        <div className="route-arrow">→</div>
                        <div className="route-point to">
                            <div className="route-label">إلى</div>
                            <div className="route-city">{data.to}</div>
                            <div className="route-time number">{data.arrivalTime}</div>
                        </div>
                    </div>

                    <div className="trip-details grid-3">
                        <div className="detail-card">
                            <div className="detail-icon">📅</div>
                            <div className="detail-label">التاريخ</div>
                            <div className="detail-value">{ArabicFormatter.formatDate(data.tripDate)}</div>
                        </div>
                        <div className="detail-card">
                            <div className="detail-icon">🚌</div>
                            <div className="detail-label">الحافلة</div>
                            <div className="detail-value">{data.busNumber}</div>
                            <div className="detail-sub">{data.busType}</div>
                        </div>
                        <div className="detail-card">
                            <div className="detail-icon">👨‍✈️</div>
                            <div className="detail-label">السائق</div>
                            <div className="detail-value">{data.driverName}</div>
                            <div className="detail-sub">{ArabicFormatter.formatPhone(data.driverPhone)}</div>
                        </div>
                    </div>
                </section>

                {/* الإحصائيات */}
                <section className="stats-section">
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-value">{data.totalSeats}</div>
                            <div className="stat-label">إجمالي المقاعد</div>
                        </div>
                        <div className="stat-box booked">
                            <div className="stat-value">{data.bookedSeats}</div>
                            <div className="stat-label">محجوز</div>
                        </div>
                        <div className="stat-box available">
                            <div className="stat-value">{data.availableSeats}</div>
                            <div className="stat-label">متاح</div>
                        </div>
                        <div className="stat-box occupancy">
                            <div className="stat-value">{occupancyRate}%</div>
                            <div className="stat-label">نسبة الإشغال</div>
                        </div>
                        <div className="stat-box revenue">
                            <div className="stat-value amount">{ArabicFormatter.formatCurrency(data.revenue, { decimals: 0 })}</div>
                            <div className="stat-label">الإيرادات المتوقعة</div>
                        </div>
                    </div>
                </section>

                {/* قائمة الركاب */}
                <section className="passengers-section">
                    <h3 className="section-title">
                        قائمة الركاب ({data.passengers.length} راكب)
                    </h3>
                    <table className="manifest-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>المقعد</th>
                                <th>اسم الراكب</th>
                                <th>رقم الهوية</th>
                                <th>الهاتف</th>
                                <th>رقم الحجز</th>
                                <th>رقم التذكرة</th>
                                <th className="no-print">الحالة</th>
                                <th className="print-only" style={{ width: '80px' }}>التوقيع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.passengers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted">
                                        لا يوجد ركاب محجوزون
                                    </td>
                                </tr>
                            ) : (
                                data.passengers.map((passenger) => (
                                    <tr key={passenger.seatNumber}>
                                        <td className="seat-cell">
                                            <span className="seat-number">{passenger.seatNumber}</span>
                                        </td>
                                        <td className="passenger-name">{passenger.passengerName}</td>
                                        <td className="number">{passenger.nationalId}</td>
                                        <td className="number">{ArabicFormatter.formatPhone(passenger.phone)}</td>
                                        <td className="number">{passenger.bookingId}</td>
                                        <td className="number">{passenger.ticketNumber}</td>
                                        <td className="no-print">{getBoardingBadge(passenger.boardingStatus)}</td>
                                        <td className="print-only signature-cell"></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </section>

                {/* التذييل */}
                <footer className="manifest-footer">
                    <div className="footer-signatures print-only">
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <div className="signature-label">توقيع السائق</div>
                        </div>
                        <div className="signature-box">
                            <div className="signature-line"></div>
                            <div className="signature-label">توقيع المشرف</div>
                        </div>
                    </div>
                    <p className="text-small text-muted text-center">
                        تم إصدار هذا الكشف في {ArabicFormatter.formatDateTime(new Date())}
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default TripManifest;

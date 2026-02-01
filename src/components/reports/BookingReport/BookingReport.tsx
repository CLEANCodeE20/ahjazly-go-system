/**
 * تقرير الحجز (Booking Report)
 * يعرض تفاصيل الحجز مع معلومات الرحلة والركاب
 */

import React, { useEffect, useState } from 'react';
import { ArabicFormatter } from '@/utils/formatters/ArabicFormatter';
import { QRCodeGenerator } from '@/utils/qrcode/QRCodeGenerator';
import '@/styles/reports/base.css';
import '@/styles/reports/print.css';
import './BookingReport.css';

export interface Passenger {
    id: number;
    name: string;
    nationalId: string;
    seatNumber: string;
    ticketNumber: string;
}

export interface BookingReportData {
    // معلومات الحجز
    bookingId: string;
    bookingDate: Date;
    bookingStatus: 'confirmed' | 'cancelled' | 'pending';

    // معلومات الرحلة
    trip: {
        tripNumber: string;
        from: string;
        to: string;
        departureDate: Date;
        departureTime: string;
        arrivalTime: string;
        busNumber: string;
        driverName: string;
    };

    // معلومات العميل
    customer: {
        name: string;
        phone: string;
        email?: string;
        nationalId?: string;
    };

    // الركاب
    passengers: Passenger[];

    // المبالغ
    subtotal: number;
    vat: number;
    total: number;

    // معلومات الدفع
    paymentStatus: 'paid' | 'pending' | 'refunded';
    paymentMethod?: string;

    // الشركة
    company: {
        name: string;
        logo?: string;
        phone: string;
        vatNumber: string;
    };

    // ملاحظات
    notes?: string;
}

interface BookingReportProps {
    data: BookingReportData;
    showPrintButton?: boolean;
}

export const BookingReport: React.FC<BookingReportProps> = ({
    data,
    showPrintButton = true,
}) => {
    const [qrCode, setQRCode] = useState<string>('');

    useEffect(() => {
        const generateQR = async () => {
            try {
                const qrData = `BOOKING:${data.bookingId}|TRIP:${data.trip.tripNumber}|SEATS:${data.passengers.length}`;
                const qr = await QRCodeGenerator.generateTextQR(qrData, 150);
                setQRCode(qr);
            } catch (error) {
                console.error('Error generating QR:', error);
            }
        };
        generateQR();
    }, [data]);

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            confirmed: { text: 'مؤكد', class: 'status-success' },
            cancelled: { text: 'ملغي', class: 'status-danger' },
            pending: { text: 'قيد الانتظار', class: 'status-warning' },
            paid: { text: 'مدفوع', class: 'status-success' },
            refunded: { text: 'مسترد', class: 'status-info' },
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    return (
        <div className="booking-report-wrapper">
            {showPrintButton && (
                <div className="report-actions no-print">
                    <button onClick={handlePrint} className="btn btn-primary">
                        🖨️ طباعة التقرير
                    </button>
                </div>
            )}

            <div className="report-container booking-report">
                {/* الرأس */}
                <header className="report-header">
                    <div className="company-section">
                        {data.company.logo && (
                            <img src={data.company.logo} alt={data.company.name} className="logo" />
                        )}
                        <h1 className="company-name">{data.company.name}</h1>
                        <p className="text-muted">هاتف: {ArabicFormatter.formatPhone(data.company.phone)}</p>
                    </div>
                    <div className="report-info">
                        <h2 className="report-title">تقرير حجز</h2>
                        <div className="meta-info">
                            <p><strong>رقم الحجز:</strong> {data.bookingId}</p>
                            <p><strong>التاريخ:</strong> {ArabicFormatter.formatDate(data.bookingDate)}</p>
                            <p><strong>الحالة:</strong> {getStatusBadge(data.bookingStatus)}</p>
                        </div>
                    </div>
                </header>

                <hr className="divider" />

                {/* معلومات الرحلة */}
                <section className="trip-section">
                    <h3 className="section-title">تفاصيل الرحلة</h3>
                    <div className="trip-details grid-2">
                        <div className="detail-box">
                            <div className="detail-label">رقم الرحلة</div>
                            <div className="detail-value">{data.trip.tripNumber}</div>
                        </div>
                        <div className="detail-box">
                            <div className="detail-label">رقم الحافلة</div>
                            <div className="detail-value">{data.trip.busNumber}</div>
                        </div>
                        <div className="detail-box">
                            <div className="detail-label">المسار</div>
                            <div className="detail-value route">
                                <span className="from">{data.trip.from}</span>
                                <span className="arrow">←</span>
                                <span className="to">{data.trip.to}</span>
                            </div>
                        </div>
                        <div className="detail-box">
                            <div className="detail-label">السائق</div>
                            <div className="detail-value">{data.trip.driverName}</div>
                        </div>
                        <div className="detail-box">
                            <div className="detail-label">تاريخ المغادرة</div>
                            <div className="detail-value">
                                {ArabicFormatter.formatDate(data.trip.departureDate)}
                            </div>
                        </div>
                        <div className="detail-box">
                            <div className="detail-label">وقت المغادرة</div>
                            <div className="detail-value number">{data.trip.departureTime}</div>
                        </div>
                    </div>
                </section>

                {/* معلومات العميل */}
                <section className="customer-section">
                    <h3 className="section-title">بيانات العميل</h3>
                    <div className="customer-details grid-2">
                        <div className="detail-row">
                            <strong>الاسم:</strong> {data.customer.name}
                        </div>
                        <div className="detail-row">
                            <strong>الهاتف:</strong> {ArabicFormatter.formatPhone(data.customer.phone)}
                        </div>
                        {data.customer.email && (
                            <div className="detail-row">
                                <strong>البريد:</strong> {data.customer.email}
                            </div>
                        )}
                        {data.customer.nationalId && (
                            <div className="detail-row">
                                <strong>رقم الهوية:</strong> {data.customer.nationalId}
                            </div>
                        )}
                    </div>
                </section>

                {/* قائمة الركاب */}
                <section className="passengers-section">
                    <h3 className="section-title">قائمة الركاب ({data.passengers.length})</h3>
                    <table className="passengers-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الاسم</th>
                                <th>رقم الهوية</th>
                                <th>رقم المقعد</th>
                                <th>رقم التذكرة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.passengers.map((passenger, index) => (
                                <tr key={passenger.id}>
                                    <td className="number">{index + 1}</td>
                                    <td>{passenger.name}</td>
                                    <td className="number">{passenger.nationalId}</td>
                                    <td className="number seat-number">{passenger.seatNumber}</td>
                                    <td className="number">{passenger.ticketNumber}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* المبالغ */}
                <section className="payment-section">
                    <h3 className="section-title">تفاصيل الدفع</h3>
                    <div className="payment-details">
                        <div className="payment-row">
                            <span>المجموع الفرعي:</span>
                            <span className="amount">{ArabicFormatter.formatCurrency(data.subtotal)}</span>
                        </div>
                        <div className="payment-row">
                            <span>ضريبة القيمة المضافة (15%):</span>
                            <span className="amount">{ArabicFormatter.formatCurrency(data.vat)}</span>
                        </div>
                        <div className="payment-row total">
                            <span>الإجمالي:</span>
                            <span className="amount">{ArabicFormatter.formatCurrency(data.total)}</span>
                        </div>
                        <div className="payment-row">
                            <span>حالة الدفع:</span>
                            <span>{getStatusBadge(data.paymentStatus)}</span>
                        </div>
                        {data.paymentMethod && (
                            <div className="payment-row">
                                <span>طريقة الدفع:</span>
                                <span>{data.paymentMethod}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* الملاحظات */}
                {data.notes && (
                    <section className="notes-section">
                        <h4>ملاحظات:</h4>
                        <p>{data.notes}</p>
                    </section>
                )}

                {/* QR Code */}
                {qrCode && (
                    <section className="qr-section">
                        <img src={qrCode} alt="QR Code" className="qr-code" />
                        <p className="qr-label text-muted text-small">
                            امسح للتحقق من الحجز
                        </p>
                    </section>
                )}

                {/* التذييل */}
                <footer className="report-footer">
                    <p className="text-muted text-small">
                        يرجى الاحتفاظ بهذا التقرير كإثبات للحجز
                    </p>
                    <p className="text-small print-only">
                        تم إصدار هذا التقرير في {ArabicFormatter.formatDateTime(new Date())}
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default BookingReport;

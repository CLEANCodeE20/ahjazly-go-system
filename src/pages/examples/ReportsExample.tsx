/**
 * صفحة أمثلة التقارير
 * تعرض جميع أنواع التقارير المتاحة في النظام
 */

import React, { useState } from 'react';
import {
    Invoice,
    BookingReport,
    TripManifest,
    PartnerStatement,
    InvoiceData,
    BookingReportData,
    TripManifestData,
    PartnerStatementData,
} from '@/components/reports';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type ReportType = 'invoice' | 'booking' | 'manifest' | 'statement';

const ReportsExample = () => {
    const [selectedReport, setSelectedReport] = useState<ReportType>('invoice');

    // بيانات تجريبية للفاتورة
    const invoiceData: InvoiceData = {
        invoiceNumber: 'INV-2026-001',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        company: {
            name: 'شركة النقل المتقدم',
            logo: '/logo.png',
            address: 'شارع الملك فهد، حي العليا',
            city: 'الرياض 12345',
            phone: '0112345678',
            email: 'info@transport.sa',
            vatNumber: '300123456789003',
            crNumber: '1010123456',
        },
        customer: {
            name: 'أحمد محمد العلي',
            address: 'شارع الأمير سلطان',
            city: 'جدة',
            phone: '0501234567',
            email: 'ahmed@example.com',
        },
        items: [
            {
                id: 1,
                name: 'تذكرة حافلة - الرياض إلى جدة',
                description: 'درجة أولى - مقعد رقم 12A',
                quantity: 2,
                price: 150.0,
                total: 300.0,
            },
            {
                id: 2,
                name: 'خدمة الوجبات',
                quantity: 2,
                price: 25.0,
                total: 50.0,
            },
        ],
        subtotal: 350.0,
        vat: 52.5,
        total: 402.5,
        paymentStatus: 'paid',
        paymentMethod: 'بطاقة ائتمان',
    };

    // بيانات تجريبية لتقرير الحجز
    const bookingData: BookingReportData = {
        bookingId: 'BK-2026-12345',
        bookingDate: new Date(),
        bookingStatus: 'confirmed',
        trip: {
            tripNumber: 'TR-001',
            from: 'الرياض',
            to: 'جدة',
            departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            departureTime: '08:00 ص',
            arrivalTime: '06:00 م',
            busNumber: 'BUS-101',
            driverName: 'محمد أحمد',
        },
        customer: {
            name: 'أحمد محمد العلي',
            phone: '0501234567',
            email: 'ahmed@example.com',
        },
        passengers: [
            {
                id: 1,
                name: 'أحمد محمد العلي',
                nationalId: '1234567890',
                seatNumber: '12A',
                ticketNumber: 'TKT-001',
            },
            {
                id: 2,
                name: 'فاطمة أحمد',
                nationalId: '0987654321',
                seatNumber: '12B',
                ticketNumber: 'TKT-002',
            },
        ],
        subtotal: 300.0,
        vat: 45.0,
        total: 345.0,
        paymentStatus: 'paid',
        paymentMethod: 'بطاقة ائتمان',
        company: {
            name: 'شركة النقل المتقدم',
            phone: '0112345678',
            vatNumber: '300123456789003',
        },
    };

    // بيانات تجريبية لكشف الركاب
    const manifestData: TripManifestData = {
        tripNumber: 'TR-001',
        tripDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        from: 'الرياض',
        to: 'جدة',
        departureTime: '08:00 ص',
        arrivalTime: '06:00 م',
        busNumber: 'BUS-101',
        busType: 'VIP - 45 مقعد',
        totalSeats: 45,
        driverName: 'محمد أحمد',
        driverPhone: '0501111111',
        driverLicense: 'DL-12345',
        passengers: [
            {
                seatNumber: '1A',
                passengerName: 'أحمد محمد',
                nationalId: '1234567890',
                phone: '0501234567',
                bookingId: 'BK-001',
                ticketNumber: 'TKT-001',
                boardingStatus: 'boarded',
            },
            {
                seatNumber: '2A',
                passengerName: 'فاطمة أحمد',
                nationalId: '0987654321',
                phone: '0509876543',
                bookingId: 'BK-002',
                ticketNumber: 'TKT-002',
                boardingStatus: 'pending',
            },
        ],
        bookedSeats: 2,
        availableSeats: 43,
        revenue: 600.0,
        company: {
            name: 'شركة النقل المتقدم',
        },
    };

    // بيانات تجريبية لكشف الحساب
    const statementData: PartnerStatementData = {
        statementNumber: 'ST-2026-001',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        generatedDate: new Date(),
        partner: {
            id: 123,
            name: 'محمد أحمد',
            companyName: 'شركة النقل الذهبي',
            vatNumber: '300987654321003',
            phone: '0501234567',
            email: 'partner@example.com',
        },
        transactions: [
            {
                id: 1,
                date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                type: 'booking',
                description: 'حجز رحلة الرياض - جدة',
                bookingId: 'BK-001',
                debit: 0,
                credit: 1000,
                balance: 1000,
            },
            {
                id: 2,
                date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                type: 'commission',
                description: 'عمولة المنصة (15%)',
                debit: 150,
                credit: 0,
                balance: 850,
            },
            {
                id: 3,
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                type: 'payment',
                description: 'دفعة للشريك',
                debit: 850,
                credit: 0,
                balance: 0,
            },
        ],
        summary: {
            openingBalance: 0,
            totalBookings: 5,
            totalRevenue: 5000,
            totalCommission: 750,
            totalRefunds: 200,
            totalPayments: 4050,
            closingBalance: 0,
        },
        company: {
            name: 'شركة النقل المتقدم',
            address: 'شارع الملك فهد، الرياض',
            phone: '0112345678',
            email: 'info@transport.sa',
            vatNumber: '300123456789003',
        },
    };

    const renderReport = () => {
        switch (selectedReport) {
            case 'invoice':
                return <Invoice data={invoiceData} showPrintButton={true} />;
            case 'booking':
                return <BookingReport data={bookingData} showPrintButton={true} />;
            case 'manifest':
                return <TripManifest data={manifestData} showPrintButton={true} />;
            case 'statement':
                return <PartnerStatement data={statementData} showPrintButton={true} />;
            default:
                return null;
        }
    };

    return (
        <div className="reports-example-page">
            <div className="page-header no-print">
                <div className="container">
                    <h1>أمثلة التقارير</h1>
                    <p className="subtitle">اختر نوع التقرير لمعاينته</p>

                    <div className="report-selector">
                        <Select value={selectedReport} onValueChange={(value) => setSelectedReport(value as ReportType)}>
                            <SelectTrigger className="w-64">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="invoice">فاتورة ضريبية</SelectItem>
                                <SelectItem value="booking">تقرير حجز</SelectItem>
                                <SelectItem value="manifest">كشف ركاب الرحلة</SelectItem>
                                <SelectItem value="statement">كشف حساب الشريك</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="report-preview">
                {renderReport()}
            </div>

            <style>{`
        .reports-example-page {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .page-header {
          background: white;
          padding: 30px 0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 30px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .report-selector {
          margin-top: 20px;
        }

        @media print {
          .page-header {
            display: none;
          }

          .reports-example-page {
            background: white;
          }
        }
      `}</style>
        </div>
    );
};

export default ReportsExample;

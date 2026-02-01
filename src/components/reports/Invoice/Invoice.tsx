/**
 * مكون الفاتورة الاحترافية
 * فاتورة متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA)
 */

import React, { useEffect, useState } from 'react';
import { ArabicFormatter } from '@/utils/formatters/ArabicFormatter';
import { QRCodeGenerator } from '@/utils/qrcode/QRCodeGenerator';
import '@/styles/reports/base.css';
import '@/styles/reports/print.css';
import './Invoice.css';

export interface InvoiceItem {
    id: number;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    total: number;
}

export interface InvoiceData {
    // معلومات الفاتورة
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date;

    // معلومات الشركة
    company: {
        name: string;
        logo?: string;
        address: string;
        city: string;
        phone: string;
        email?: string;
        vatNumber: string;
        crNumber: string;
    };

    // معلومات العميل
    customer: {
        name: string;
        address?: string;
        city?: string;
        phone?: string;
        email?: string;
        vatNumber?: string;
    };

    // البنود
    items: InvoiceItem[];

    // المبالغ
    subtotal: number;
    vatRate?: number;
    vat: number;
    total: number;

    // ملاحظات
    notes?: string;
    terms?: string;

    // حالة الدفع
    paymentStatus?: 'paid' | 'pending' | 'overdue';
    paymentMethod?: string;
}

interface InvoiceProps {
    data: InvoiceData;
    showPrintButton?: boolean;
}

export const Invoice: React.FC<InvoiceProps> = ({
    data,
    showPrintButton = true
}) => {
    const [qrCode, setQRCode] = useState<string>('');

    useEffect(() => {
        // توليد QR Code
        const generateQR = async () => {
            try {
                const qr = await QRCodeGenerator.generateInvoiceQR({
                    sellerName: data.company.name,
                    vatNumber: data.company.vatNumber,
                    timestamp: data.invoiceDate.toISOString(),
                    total: data.total,
                    vat: data.vat,
                });
                setQRCode(qr);
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        };

        generateQR();
    }, [data]);

    const handlePrint = () => {
        window.print();
    };

    const getPaymentStatusBadge = () => {
        const status = data.paymentStatus || 'pending';
        const badges = {
            paid: { text: 'مدفوعة', class: 'status-success' },
            pending: { text: 'قيد الانتظار', class: 'status-warning' },
            overdue: { text: 'متأخرة', class: 'status-danger' },
        };

        const badge = badges[status];
        return (
            <span className={`status-badge ${badge.class}`}>
                {badge.text}
            </span>
        );
    };

    return (
        <div className="invoice-wrapper">
            {/* أزرار الإجراءات - لا تُطبع */}
            {showPrintButton && (
                <div className="invoice-actions no-print">
                    <button onClick={handlePrint} className="btn btn-primary">
                        🖨️ طباعة الفاتورة
                    </button>
                </div>
            )}

            {/* الفاتورة */}
            <div className="report-container invoice-container">
                {/* الرأس */}
                <header className="invoice-header">
                    <div className="company-section">
                        {data.company.logo && (
                            <img
                                src={data.company.logo}
                                alt={data.company.name}
                                className="company-logo"
                            />
                        )}
                        <h1 className="company-name">{data.company.name}</h1>
                        <div className="company-details text-muted">
                            <p>{data.company.address}</p>
                            <p>{data.company.city}</p>
                            <p>هاتف: {ArabicFormatter.formatPhone(data.company.phone)}</p>
                            {data.company.email && <p>بريد: {data.company.email}</p>}
                            <p className="mt-sm">
                                <strong>الرقم الضريبي:</strong> {data.company.vatNumber}
                            </p>
                            <p>
                                <strong>السجل التجاري:</strong> {data.company.crNumber}
                            </p>
                        </div>
                    </div>

                    <div className="invoice-info">
                        <h2 className="invoice-title">فاتورة ضريبية</h2>
                        <div className="invoice-meta">
                            <div className="meta-row">
                                <span className="meta-label">رقم الفاتورة:</span>
                                <span className="meta-value">{data.invoiceNumber}</span>
                            </div>
                            <div className="meta-row">
                                <span className="meta-label">التاريخ:</span>
                                <span className="meta-value">
                                    {ArabicFormatter.formatDate(data.invoiceDate)}
                                </span>
                            </div>
                            {data.dueDate && (
                                <div className="meta-row">
                                    <span className="meta-label">تاريخ الاستحقاق:</span>
                                    <span className="meta-value">
                                        {ArabicFormatter.formatDate(data.dueDate)}
                                    </span>
                                </div>
                            )}
                            <div className="meta-row">
                                <span className="meta-label">الحالة:</span>
                                <span className="meta-value">{getPaymentStatusBadge()}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <hr className="divider" />

                {/* معلومات العميل */}
                <section className="customer-section">
                    <h3 className="section-title">بيانات العميل</h3>
                    <div className="customer-details">
                        <div className="detail-row">
                            <strong>الاسم:</strong> {data.customer.name}
                        </div>
                        {data.customer.address && (
                            <div className="detail-row">
                                <strong>العنوان:</strong> {data.customer.address}
                                {data.customer.city && `, ${data.customer.city}`}
                            </div>
                        )}
                        {data.customer.phone && (
                            <div className="detail-row">
                                <strong>الهاتف:</strong> {ArabicFormatter.formatPhone(data.customer.phone)}
                            </div>
                        )}
                        {data.customer.email && (
                            <div className="detail-row">
                                <strong>البريد:</strong> {data.customer.email}
                            </div>
                        )}
                        {data.customer.vatNumber && (
                            <div className="detail-row">
                                <strong>الرقم الضريبي:</strong> {data.customer.vatNumber}
                            </div>
                        )}
                    </div>
                </section>

                {/* جدول البنود */}
                <section className="items-section">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>الصنف</th>
                                <th style={{ width: '80px' }}>الكمية</th>
                                <th style={{ width: '120px' }}>السعر</th>
                                <th style={{ width: '120px' }}>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="number">{index + 1}</td>
                                    <td>
                                        <div className="item-name">{item.name}</div>
                                        {item.description && (
                                            <div className="item-description text-muted text-small">
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="number">{item.quantity}</td>
                                    <td className="currency">
                                        {ArabicFormatter.formatCurrency(item.price)}
                                    </td>
                                    <td className="currency">
                                        {ArabicFormatter.formatCurrency(item.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* المجاميع */}
                <section className="totals-section">
                    <div className="totals-container">
                        <div className="total-row">
                            <span className="total-label">المجموع الفرعي:</span>
                            <span className="total-value amount">
                                {ArabicFormatter.formatCurrency(data.subtotal)}
                            </span>
                        </div>
                        <div className="total-row">
                            <span className="total-label">
                                ضريبة القيمة المضافة ({data.vatRate || 15}%):
                            </span>
                            <span className="total-value amount">
                                {ArabicFormatter.formatCurrency(data.vat)}
                            </span>
                        </div>
                        <div className="total-row grand-total">
                            <span className="total-label">الإجمالي:</span>
                            <span className="total-value amount">
                                {ArabicFormatter.formatCurrency(data.total)}
                            </span>
                        </div>
                        <div className="total-row words">
                            <span className="total-label">المبلغ بالكلمات:</span>
                            <span className="total-value">
                                {ArabicFormatter.numberToWords(data.total)}
                            </span>
                        </div>
                    </div>
                </section>

                {/* الملاحظات */}
                {data.notes && (
                    <section className="notes-section">
                        <h4 className="section-title">ملاحظات:</h4>
                        <p className="notes-content">{data.notes}</p>
                    </section>
                )}

                {/* QR Code */}
                {qrCode && (
                    <section className="qr-section">
                        <div className="qr-container">
                            <img src={qrCode} alt="QR Code" className="qr-code" />
                            <p className="qr-label text-muted text-small">
                                امسح للتحقق من الفاتورة
                            </p>
                        </div>
                    </section>
                )}

                {/* التذييل */}
                <footer className="invoice-footer">
                    {data.terms && (
                        <div className="terms">
                            <h5>الشروط والأحكام:</h5>
                            <p className="text-small text-muted">{data.terms}</p>
                        </div>
                    )}
                    <div className="thank-you">
                        <p className="text-large">شكراً لتعاملكم معنا</p>
                    </div>
                    <div className="footer-info text-small text-muted print-only">
                        <p>
                            تم إصدار هذه الفاتورة إلكترونياً في{' '}
                            {ArabicFormatter.formatDateTime(new Date())}
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Invoice;

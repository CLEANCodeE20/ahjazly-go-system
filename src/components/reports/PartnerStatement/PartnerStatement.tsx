/**
 * كشف حساب الشريك (Partner Statement)
 * يعرض ملخص المعاملات المالية للشريك
 */

import React from 'react';
import { ArabicFormatter } from '@/utils/formatters/ArabicFormatter';
import '@/styles/reports/base.css';
import '@/styles/reports/print.css';
import './PartnerStatement.css';

export interface StatementTransaction {
    id: number;
    date: Date;
    type: 'booking' | 'refund' | 'commission' | 'payment';
    description: string;
    bookingId?: string;
    debit: number;
    credit: number;
    balance: number;
}

export interface PartnerStatementData {
    // معلومات الفترة
    statementNumber: string;
    startDate: Date;
    endDate: Date;
    generatedDate: Date;

    // معلومات الشريك
    partner: {
        id: number;
        name: string;
        companyName: string;
        vatNumber: string;
        phone: string;
        email: string;
    };

    // المعاملات
    transactions: StatementTransaction[];

    // الملخص المالي
    summary: {
        openingBalance: number;
        totalBookings: number;
        totalRevenue: number;
        totalCommission: number;
        totalRefunds: number;
        totalPayments: number;
        closingBalance: number;
    };

    // الشركة
    company: {
        name: string;
        logo?: string;
        address: string;
        phone: string;
        email: string;
        vatNumber: string;
    };
}

interface PartnerStatementProps {
    data: PartnerStatementData;
    showPrintButton?: boolean;
}

export const PartnerStatement: React.FC<PartnerStatementProps> = ({
    data,
    showPrintButton = true,
}) => {
    const handlePrint = () => {
        window.print();
    };

    const getTransactionIcon = (type: string) => {
        const icons = {
            booking: '📝',
            refund: '↩️',
            commission: '💰',
            payment: '💳',
        };
        return icons[type as keyof typeof icons] || '📄';
    };

    return (
        <div className="partner-statement-wrapper">
            {showPrintButton && (
                <div className="report-actions no-print">
                    <button onClick={handlePrint} className="btn btn-primary">
                        🖨️ طباعة كشف الحساب
                    </button>
                </div>
            )}

            <div className="report-container partner-statement">
                {/* الرأس */}
                <header className="statement-header">
                    <div className="company-section">
                        {data.company.logo && (
                            <img src={data.company.logo} alt={data.company.name} className="logo" />
                        )}
                        <h1 className="company-name">{data.company.name}</h1>
                        <div className="company-details text-muted text-small">
                            <p>{data.company.address}</p>
                            <p>هاتف: {ArabicFormatter.formatPhone(data.company.phone)}</p>
                            <p>بريد: {data.company.email}</p>
                            <p>الرقم الضريبي: {data.company.vatNumber}</p>
                        </div>
                    </div>
                    <div className="statement-info">
                        <h2 className="statement-title">كشف حساب شريك</h2>
                        <div className="meta-info">
                            <p><strong>رقم الكشف:</strong> {data.statementNumber}</p>
                            <p><strong>الفترة:</strong> {ArabicFormatter.formatDate(data.startDate)} - {ArabicFormatter.formatDate(data.endDate)}</p>
                            <p><strong>تاريخ الإصدار:</strong> {ArabicFormatter.formatDate(data.generatedDate)}</p>
                        </div>
                    </div>
                </header>

                <hr className="divider" />

                {/* معلومات الشريك */}
                <section className="partner-section">
                    <h3 className="section-title">بيانات الشريك</h3>
                    <div className="partner-details grid-2">
                        <div className="detail-row">
                            <strong>اسم الشريك:</strong> {data.partner.name}
                        </div>
                        <div className="detail-row">
                            <strong>اسم الشركة:</strong> {data.partner.companyName}
                        </div>
                        <div className="detail-row">
                            <strong>الرقم الضريبي:</strong> {data.partner.vatNumber}
                        </div>
                        <div className="detail-row">
                            <strong>الهاتف:</strong> {ArabicFormatter.formatPhone(data.partner.phone)}
                        </div>
                        <div className="detail-row">
                            <strong>البريد:</strong> {data.partner.email}
                        </div>
                        <div className="detail-row">
                            <strong>رقم الشريك:</strong> #{data.partner.id}
                        </div>
                    </div>
                </section>

                {/* الملخص المالي */}
                <section className="summary-section">
                    <h3 className="section-title">الملخص المالي</h3>
                    <div className="summary-grid">
                        <div className="summary-card opening">
                            <div className="summary-label">الرصيد الافتتاحي</div>
                            <div className="summary-value amount">
                                {ArabicFormatter.formatCurrency(data.summary.openingBalance)}
                            </div>
                        </div>
                        <div className="summary-card bookings">
                            <div className="summary-label">عدد الحجوزات</div>
                            <div className="summary-value">{data.summary.totalBookings}</div>
                        </div>
                        <div className="summary-card revenue">
                            <div className="summary-label">إجمالي الإيرادات</div>
                            <div className="summary-value amount">
                                {ArabicFormatter.formatCurrency(data.summary.totalRevenue)}
                            </div>
                        </div>
                        <div className="summary-card commission">
                            <div className="summary-label">العمولات</div>
                            <div className="summary-value amount">
                                {ArabicFormatter.formatCurrency(data.summary.totalCommission)}
                            </div>
                        </div>
                        <div className="summary-card refunds">
                            <div className="summary-label">المبالغ المستردة</div>
                            <div className="summary-value amount">
                                {ArabicFormatter.formatCurrency(data.summary.totalRefunds)}
                            </div>
                        </div>
                        <div className="summary-card payments">
                            <div className="summary-label">المدفوعات</div>
                            <div className="summary-value amount">
                                {ArabicFormatter.formatCurrency(data.summary.totalPayments)}
                            </div>
                        </div>
                        <div className="summary-card closing">
                            <div className="summary-label">الرصيد الختامي</div>
                            <div className="summary-value amount">
                                {ArabicFormatter.formatCurrency(data.summary.closingBalance)}
                            </div>
                        </div>
                    </div>
                </section>

                {/* جدول المعاملات */}
                <section className="transactions-section">
                    <h3 className="section-title">
                        تفاصيل المعاملات ({data.transactions.length})
                    </h3>
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th style={{ width: '100px' }}>التاريخ</th>
                                <th style={{ width: '60px' }}>النوع</th>
                                <th>الوصف</th>
                                <th style={{ width: '100px' }}>رقم الحجز</th>
                                <th style={{ width: '120px' }}>مدين</th>
                                <th style={{ width: '120px' }}>دائن</th>
                                <th style={{ width: '120px' }}>الرصيد</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted">
                                        لا توجد معاملات في هذه الفترة
                                    </td>
                                </tr>
                            ) : (
                                data.transactions.map((transaction, index) => (
                                    <tr key={transaction.id}>
                                        <td className="number">{index + 1}</td>
                                        <td className="number">
                                            {ArabicFormatter.formatDate(transaction.date, 'short')}
                                        </td>
                                        <td className="transaction-type">
                                            <span title={transaction.type}>
                                                {getTransactionIcon(transaction.type)}
                                            </span>
                                        </td>
                                        <td>{transaction.description}</td>
                                        <td className="number">{transaction.bookingId || '-'}</td>
                                        <td className="amount debit">
                                            {transaction.debit > 0
                                                ? ArabicFormatter.formatCurrency(transaction.debit)
                                                : '-'}
                                        </td>
                                        <td className="amount credit">
                                            {transaction.credit > 0
                                                ? ArabicFormatter.formatCurrency(transaction.credit)
                                                : '-'}
                                        </td>
                                        <td className="amount balance">
                                            {ArabicFormatter.formatCurrency(transaction.balance)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="totals-row">
                                <td colSpan={5} className="text-left"><strong>الإجمالي:</strong></td>
                                <td className="amount debit">
                                    <strong>
                                        {ArabicFormatter.formatCurrency(
                                            data.transactions.reduce((sum, t) => sum + t.debit, 0)
                                        )}
                                    </strong>
                                </td>
                                <td className="amount credit">
                                    <strong>
                                        {ArabicFormatter.formatCurrency(
                                            data.transactions.reduce((sum, t) => sum + t.credit, 0)
                                        )}
                                    </strong>
                                </td>
                                <td className="amount balance">
                                    <strong>
                                        {ArabicFormatter.formatCurrency(data.summary.closingBalance)}
                                    </strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </section>

                {/* التذييل */}
                <footer className="statement-footer">
                    <div className="footer-note">
                        <p className="text-small text-muted">
                            <strong>ملاحظة:</strong> هذا كشف حساب إلكتروني ولا يحتاج إلى ختم أو توقيع.
                            للاستفسارات يرجى التواصل على {ArabicFormatter.formatPhone(data.company.phone)}
                        </p>
                    </div>
                    <div className="footer-info text-small text-muted print-only">
                        <p>تم إصدار هذا الكشف في {ArabicFormatter.formatDateTime(new Date())}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PartnerStatement;

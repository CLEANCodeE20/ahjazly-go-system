/**
 * صفحة مثال لعرض الفاتورة الاحترافية
 */

import React from 'react';
import { Invoice, InvoiceData } from '@/components/reports';

const InvoiceExample = () => {
    // بيانات تجريبية للفاتورة
    const sampleInvoiceData: InvoiceData = {
        invoiceNumber: 'INV-2026-001',
        invoiceDate: new Date('2026-01-20'),
        dueDate: new Date('2026-02-20'),

        company: {
            name: 'شركة النقل المتقدم',
            logo: '/logo.png', // ضع مسار الشعار الفعلي
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
                price: 150.00,
                total: 300.00,
            },
            {
                id: 2,
                name: 'خدمة الوجبات',
                description: 'وجبة إفطار',
                quantity: 2,
                price: 25.00,
                total: 50.00,
            },
            {
                id: 3,
                name: 'تأمين الرحلة',
                quantity: 2,
                price: 10.00,
                total: 20.00,
            },
        ],

        subtotal: 370.00,
        vatRate: 15,
        vat: 55.50,
        total: 425.50,

        notes: 'يرجى الوصول قبل موعد المغادرة بـ 30 دقيقة. يُسمح بحقيبة واحدة لكل راكب.',
        terms: 'لا يمكن استرداد المبلغ بعد 24 ساعة من موعد الرحلة. يُرجى الاحتفاظ بهذه الفاتورة كإثبات للدفع.',

        paymentStatus: 'paid',
        paymentMethod: 'بطاقة ائتمان',
    };

    return (
        <div>
            <Invoice data={sampleInvoiceData} showPrintButton={true} />
        </div>
    );
};

export default InvoiceExample;

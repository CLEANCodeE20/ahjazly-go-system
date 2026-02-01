/**
 * مولد رموز QR Code
 * يدعم توليد رموز QR للفواتير متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA)
 */

import QRCode from 'qrcode';

export interface InvoiceQRData {
    sellerName: string;
    vatNumber: string;
    timestamp: string;
    total: number;
    vat: number;
}

export class QRCodeGenerator {
    /**
     * توليد QR Code كـ Data URL
     * @param data - البيانات المراد تحويلها لـ QR
     * @param options - خيارات التوليد
     * @returns Data URL للصورة
     */
    static async generateDataURL(
        data: string,
        options: {
            width?: number;
            margin?: number;
            errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
            color?: {
                dark?: string;
                light?: string;
            };
        } = {}
    ): Promise<string> {
        const {
            width = 200,
            margin = 1,
            errorCorrectionLevel = 'M',
            color = { dark: '#000000', light: '#FFFFFF' },
        } = options;

        try {
            return await QRCode.toDataURL(data, {
                width,
                margin,
                errorCorrectionLevel,
                color,
                type: 'image/png',
            });
        } catch (error) {
            console.error('Error generating QR Code:', error);
            throw new Error('فشل في توليد رمز QR');
        }
    }

    /**
     * توليد QR Code للفاتورة متوافق مع ZATCA
     * يستخدم تنسيق TLV (Tag-Length-Value) حسب متطلبات هيئة الزكاة
     * @param invoice - بيانات الفاتورة
     * @returns Data URL لرمز QR
     */
    static async generateInvoiceQR(invoice: InvoiceQRData): Promise<string> {
        try {
            // تنسيق TLV (Tag-Length-Value) حسب متطلبات ZATCA
            const tlvData = [
                { tag: 1, value: invoice.sellerName }, // اسم البائع
                { tag: 2, value: invoice.vatNumber }, // الرقم الضريبي
                { tag: 3, value: invoice.timestamp }, // تاريخ ووقت الفاتورة
                { tag: 4, value: invoice.total.toFixed(2) }, // إجمالي الفاتورة
                { tag: 5, value: invoice.vat.toFixed(2) }, // مبلغ ضريبة القيمة المضافة
            ];

            // تحويل إلى TLV hex string
            const tlvHex = tlvData
                .map(({ tag, value }) => {
                    const valueBuffer = Buffer.from(value, 'utf8');
                    const tagHex = tag.toString(16).padStart(2, '0');
                    const lengthHex = valueBuffer.length.toString(16).padStart(2, '0');
                    const valueHex = valueBuffer.toString('hex');
                    return tagHex + lengthHex + valueHex;
                })
                .join('');

            // تحويل إلى Base64
            const base64 = Buffer.from(tlvHex, 'hex').toString('base64');

            // توليد QR Code
            return await this.generateDataURL(base64, {
                width: 200,
                errorCorrectionLevel: 'M',
                margin: 2,
            });
        } catch (error) {
            console.error('Error generating invoice QR:', error);
            throw new Error('فشل في توليد رمز QR للفاتورة');
        }
    }

    /**
     * توليد QR Code بسيط لنص
     * @param text - النص
     * @param size - حجم الصورة
     * @returns Data URL لرمز QR
     */
    static async generateTextQR(
        text: string,
        size: number = 150
    ): Promise<string> {
        return await this.generateDataURL(text, {
            width: size,
            errorCorrectionLevel: 'M',
        });
    }

    /**
     * توليد QR Code لرابط URL
     * @param url - الرابط
     * @param size - حجم الصورة
     * @returns Data URL لرمز QR
     */
    static async generateURLQR(url: string, size: number = 150): Promise<string> {
        // التحقق من صحة الرابط
        try {
            new URL(url);
        } catch {
            throw new Error('الرابط غير صالح');
        }

        return await this.generateDataURL(url, {
            width: size,
            errorCorrectionLevel: 'L', // L كافي للروابط
        });
    }

    /**
     * توليد QR Code لمعلومات الاتصال (vCard)
     * @param contact - معلومات الاتصال
     * @returns Data URL لرمز QR
     */
    static async generateContactQR(contact: {
        name: string;
        phone?: string;
        email?: string;
        organization?: string;
        address?: string;
    }): Promise<string> {
        const vCard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${contact.name}`,
            contact.organization ? `ORG:${contact.organization}` : '',
            contact.phone ? `TEL:${contact.phone}` : '',
            contact.email ? `EMAIL:${contact.email}` : '',
            contact.address ? `ADR:;;${contact.address}` : '',
            'END:VCARD',
        ]
            .filter(Boolean)
            .join('\n');

        return await this.generateDataURL(vCard, {
            width: 200,
            errorCorrectionLevel: 'M',
        });
    }

    /**
     * توليد QR Code لمعلومات الدفع
     * @param payment - معلومات الدفع
     * @returns Data URL لرمز QR
     */
    static async generatePaymentQR(payment: {
        iban: string;
        beneficiary: string;
        amount?: number;
        reference?: string;
    }): Promise<string> {
        // تنسيق BCD للمدفوعات (يستخدم في أوروبا، يمكن تعديله للسعودية)
        const paymentData = [
            'BCD', // Service Tag
            '002', // Version
            '1', // Character Set (UTF-8)
            'SCT', // Identification
            '', // BIC (optional)
            payment.beneficiary,
            payment.iban,
            payment.amount ? `SAR${payment.amount.toFixed(2)}` : '',
            '', // Purpose
            payment.reference || '',
            '', // Remittance Information
        ].join('\n');

        return await this.generateDataURL(paymentData, {
            width: 200,
            errorCorrectionLevel: 'M',
        });
    }
}

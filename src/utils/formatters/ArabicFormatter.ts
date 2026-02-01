/**
 * مكتبة تنسيق البيانات العربية
 * توفر تنسيق موحد للعملات، الأرقام، التواريخ، والنسب المئوية
 */

export class ArabicFormatter {
    private static readonly LOCALE = 'ar-SA';
    private static readonly CURRENCY = 'SAR';
    private static readonly VAT_RATE = 15; // ضريبة القيمة المضافة الافتراضية

    /**
     * تنسيق العملة بالريال السعودي
     * @param amount - المبلغ
     * @param options - خيارات التنسيق
     * @returns المبلغ منسق
     * @example formatCurrency(1234.56) => "1,234.56 ر.س"
     */
    static formatCurrency(
        amount: number,
        options: {
            decimals?: number;
            showSymbol?: boolean;
            useArabicNumerals?: boolean;
        } = {}
    ): string {
        const {
            decimals = 2,
            showSymbol = true,
            useArabicNumerals = false,
        } = options;

        const formatted = new Intl.NumberFormat(this.LOCALE, {
            style: showSymbol ? 'currency' : 'decimal',
            currency: this.CURRENCY,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(amount);

        return useArabicNumerals ? this.toArabicNumerals(formatted) : formatted;
    }

    /**
     * تنسيق الأرقام
     * @param value - القيمة
     * @param decimals - عدد الخانات العشرية
     * @param useArabicNumerals - استخدام الأرقام العربية
     * @returns الرقم منسق
     * @example formatNumber(1234567.89) => "1,234,567.89"
     */
    static formatNumber(
        value: number,
        decimals: number = 2,
        useArabicNumerals: boolean = false
    ): string {
        const formatted = new Intl.NumberFormat(this.LOCALE, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);

        return useArabicNumerals ? this.toArabicNumerals(formatted) : formatted;
    }

    /**
     * تنسيق النسبة المئوية
     * @param value - القيمة (من 0 إلى 100)
     * @param decimals - عدد الخانات العشرية
     * @param useArabicNumerals - استخدام الأرقام العربية
     * @returns النسبة منسقة
     * @example formatPercentage(15) => "15%"
     */
    static formatPercentage(
        value: number,
        decimals: number = 0,
        useArabicNumerals: boolean = false
    ): string {
        const formatted = new Intl.NumberFormat(this.LOCALE, {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value / 100);

        return useArabicNumerals ? this.toArabicNumerals(formatted) : formatted;
    }

    /**
     * تنسيق التاريخ
     * @param date - التاريخ
     * @param format - نوع التنسيق
     * @returns التاريخ منسق
     * @example formatDate(new Date()) => "٢٠ يناير ٢٠٢٦"
     */
    static formatDate(
        date: Date | string,
        format: 'short' | 'medium' | 'long' = 'medium'
    ): string {
        const d = typeof date === 'string' ? new Date(date) : date;

        const options: Intl.DateTimeFormatOptions = {
            short: { year: 'numeric', month: '2-digit', day: '2-digit' },
            medium: { year: 'numeric', month: 'long', day: 'numeric' },
            long: {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            },
        }[format];

        return new Intl.DateTimeFormat(this.LOCALE, options).format(d);
    }

    /**
     * تنسيق الوقت
     * @param date - التاريخ والوقت
     * @returns الوقت منسق
     * @example formatTime(new Date()) => "٦:٣٠ م"
     */
    static formatTime(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;

        return new Intl.DateTimeFormat(this.LOCALE, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(d);
    }

    /**
     * تنسيق التاريخ والوقت معاً
     * @param date - التاريخ والوقت
     * @returns التاريخ والوقت منسقان
     */
    static formatDateTime(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;

        return new Intl.DateTimeFormat(this.LOCALE, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(d);
    }

    /**
     * حساب ضريبة القيمة المضافة
     * @param amount - المبلغ قبل الضريبة
     * @param vatRate - نسبة الضريبة (افتراضي 15%)
     * @returns كائن يحتوي على المجموع الفرعي، الضريبة، والإجمالي
     */
    static calculateVAT(
        amount: number,
        vatRate: number = this.VAT_RATE
    ): {
        subtotal: number;
        vat: number;
        total: number;
        vatRate: number;
    } {
        const subtotal = Number(amount.toFixed(2));
        const vat = Number((subtotal * (vatRate / 100)).toFixed(2));
        const total = Number((subtotal + vat).toFixed(2));

        return { subtotal, vat, total, vatRate };
    }

    /**
     * استخراج المبلغ قبل الضريبة من المبلغ الإجمالي
     * @param totalWithVAT - المبلغ الإجمالي شامل الضريبة
     * @param vatRate - نسبة الضريبة
     * @returns كائن يحتوي على المجموع الفرعي، الضريبة، والإجمالي
     */
    static extractVAT(
        totalWithVAT: number,
        vatRate: number = this.VAT_RATE
    ): {
        subtotal: number;
        vat: number;
        total: number;
        vatRate: number;
    } {
        const total = Number(totalWithVAT.toFixed(2));
        const subtotal = Number((total / (1 + vatRate / 100)).toFixed(2));
        const vat = Number((total - subtotal).toFixed(2));

        return { subtotal, vat, total, vatRate };
    }

    /**
     * تحويل الأرقام الإنجليزية إلى عربية
     * @param str - النص المحتوي على أرقام
     * @returns النص بأرقام عربية
     */
    private static toArabicNumerals(str: string): string {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return str.replace(/\d/g, (d) => arabicNumerals[parseInt(d)]);
    }

    /**
     * تحويل الرقم إلى كلمات عربية
     * @param num - الرقم
     * @returns الرقم بالكلمات
     * @example numberToWords(1234) => "ألف ومئتان وأربعة وثلاثون"
     */
    static numberToWords(num: number): string {
        if (num === 0) return 'صفر';

        const ones = [
            '',
            'واحد',
            'اثنان',
            'ثلاثة',
            'أربعة',
            'خمسة',
            'ستة',
            'سبعة',
            'ثمانية',
            'تسعة',
        ];
        const tens = [
            '',
            'عشرة',
            'عشرون',
            'ثلاثون',
            'أربعون',
            'خمسون',
            'ستون',
            'سبعون',
            'ثمانون',
            'تسعون',
        ];
        const hundreds = [
            '',
            'مائة',
            'مئتان',
            'ثلاثمائة',
            'أربعمائة',
            'خمسمائة',
            'ستمائة',
            'سبعمائة',
            'ثمانمائة',
            'تسعمائة',
        ];
        const teens = [
            'عشرة',
            'أحد عشر',
            'اثنا عشر',
            'ثلاثة عشر',
            'أربعة عشر',
            'خمسة عشر',
            'ستة عشر',
            'سبعة عشر',
            'ثمانية عشر',
            'تسعة عشر',
        ];

        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);

        let result = '';

        // الآلاف
        if (integerPart >= 1000) {
            const thousands = Math.floor(integerPart / 1000);
            if (thousands === 1) {
                result += 'ألف';
            } else if (thousands === 2) {
                result += 'ألفان';
            } else if (thousands <= 10) {
                result += ones[thousands] + ' آلاف';
            } else {
                result += this.convertHundreds(thousands) + ' ألف';
            }
            result += ' و';
        }

        // المئات والعشرات والآحاد
        const remainder = integerPart % 1000;
        if (remainder > 0) {
            result += this.convertHundreds(remainder);
        } else {
            result = result.slice(0, -3); // إزالة " و" الأخيرة
        }

        // الجزء العشري
        if (decimalPart > 0) {
            result += ' و' + this.convertHundreds(decimalPart) + ' هللة';
        }

        return result.trim() + ' ريال سعودي';
    }

    /**
     * تحويل الأعداد من 1 إلى 999 إلى كلمات
     */
    private static convertHundreds(num: number): string {
        const ones = [
            '',
            'واحد',
            'اثنان',
            'ثلاثة',
            'أربعة',
            'خمسة',
            'ستة',
            'سبعة',
            'ثمانية',
            'تسعة',
        ];
        const tens = [
            '',
            'عشرة',
            'عشرون',
            'ثلاثون',
            'أربعون',
            'خمسون',
            'ستون',
            'سبعون',
            'ثمانون',
            'تسعون',
        ];
        const hundreds = [
            '',
            'مائة',
            'مئتان',
            'ثلاثمائة',
            'أربعمائة',
            'خمسمائة',
            'ستمائة',
            'سبعمائة',
            'ثمانمائة',
            'تسعمائة',
        ];
        const teens = [
            'عشرة',
            'أحد عشر',
            'اثنا عشر',
            'ثلاثة عشر',
            'أربعة عشر',
            'خمسة عشر',
            'ستة عشر',
            'سبعة عشر',
            'ثمانية عشر',
            'تسعة عشر',
        ];

        let result = '';

        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const o = num % 10;

        if (h > 0) {
            result += hundreds[h];
            if (t > 0 || o > 0) result += ' و';
        }

        if (t === 1) {
            result += teens[o];
        } else {
            if (t > 0) {
                result += tens[t];
                if (o > 0) result += ' و';
            }
            if (o > 0 && t !== 1) {
                result += ones[o];
            }
        }

        return result;
    }

    /**
     * تنسيق رقم الهاتف السعودي
     * @param phone - رقم الهاتف
     * @returns رقم الهاتف منسق
     * @example formatPhone("0501234567") => "050 123 4567"
     */
    static formatPhone(phone: string): string {
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length === 10 && cleaned.startsWith('0')) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        } else if (cleaned.length === 12 && cleaned.startsWith('966')) {
            return `+966 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
        }

        return phone;
    }

    /**
     * تنسيق الرقم الضريبي السعودي
     * @param vatNumber - الرقم الضريبي
     * @returns الرقم الضريبي منسق
     * @example formatVATNumber("123456789012345") => "123456789012345"
     */
    static formatVATNumber(vatNumber: string): string {
        const cleaned = vatNumber.replace(/\D/g, '');

        if (cleaned.length === 15) {
            return cleaned;
        }

        return vatNumber;
    }
}

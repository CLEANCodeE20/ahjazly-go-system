/**
 * تعرّيفات أنواع البيانات الخاصة بالتقارير
 */

export interface ReportConfig {
    // إعدادات الشركة
    companyInfo: {
        name: string;
        logo?: string;
        address?: string;
        city?: string;
        phone: string;
        email?: string;
        vatNumber?: string;
        crNumber?: string;
    };

    // إعدادات التقرير
    reportInfo: {
        title: string;
        number?: string;
        date: Date;
        period?: {
            from: Date;
            to: Date;
        };
        status?: string;
    };

    // إعدادات التصميم
    design: {
        theme: 'light' | 'dark' | 'auto';
        language: 'ar' | 'en';
        rtl: boolean;
        fontFamily?: string;
        fontSize?: 'small' | 'normal' | 'large';
        colors: {
            primary: string;
            secondary: string;
            success: string;
            warning: string;
            danger: string;
        };
    };

    // إعدادات الطباعة
    printOptions: {
        includeHeader: boolean;
        includeFooter: boolean;
        includePageNumbers: boolean;
        includeLogo: boolean;
        orientation: 'portrait' | 'landscape';
        paperSize: 'A4' | 'A3' | 'A5' | 'letter';
    };

    // إعدادات التصدير
    exportOptions: {
        includePdf: boolean;
        includeExcel: boolean;
        includeCsv: boolean;
        includePrint: boolean;
    };

    // إعدادات الأذونات
    permissions: {
        canView: boolean;
        canPrint: boolean;
        canExport: boolean;
        canShare: boolean;
    };
}

// نوع البيانات المشتركة بين جميع التقارير
export interface BaseReportData {
    createdAt: Date;
    updatedAt: Date;
    generatedBy: string;
    companyId: string;
    metadata?: Record<string, any>;
}

// إعدادات التهيئة الافتراضية
export const DEFAULT_REPORT_CONFIG: ReportConfig = {
    companyInfo: {
        name: '',
        phone: '',
        city: '',
    },
    reportInfo: {
        title: 'تقرير جديد',
        date: new Date(),
    },
    design: {
        theme: 'light',
        language: 'ar',
        rtl: true,
        colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
        },
    },
    printOptions: {
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        includeLogo: true,
        orientation: 'portrait',
        paperSize: 'A4',
    },
    exportOptions: {
        includePdf: true,
        includeExcel: true,
        includeCsv: true,
        includePrint: true,
    },
    permissions: {
        canView: true,
        canPrint: true,
        canExport: true,
        canShare: true,
    },
};
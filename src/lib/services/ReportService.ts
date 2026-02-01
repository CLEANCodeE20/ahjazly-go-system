import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import ArabicReshaper from 'arabic-reshaper';
import { NotoSansArabicBase64 } from "@/assets/fonts/noto-sans-arabic";

/**
 * Professional Report Service
 * Handles PDF and Excel generation with comprehensive Arabic RTL support
 */

// ============= Arabic Text Processing =============

/**
 * Processes Arabic text for proper rendering in PDFs
 * - Reshapes Arabic characters for proper ligature display
 * - Handles bidirectional text (Arabic + English/Numbers)
 * - Properly reverses text for RTL rendering in LTR context
 */
export const processArabicText = (text: string): string => {
    if (!text) return "";
    
    // Convert to string if not already
    const str = String(text);
    
    // Check if text contains Arabic characters
    const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
    if (!hasArabic) return str;
    
    try {
        // @ts-ignore - arabic-reshaper types
        const reshaped = ArabicReshaper.convertArabic(str);
        
        // Split by LTR segments (Latin, Numbers, Special chars)
        const ltrRegex = /([a-zA-Z0-9@._\-\+:\/\(\)\%\s]+)/g;
        const pieces = reshaped.split(ltrRegex);
        
        // Process each piece: reverse Arabic, keep LTR as-is
        return pieces
            .map(piece => {
                if (piece.match(ltrRegex)) {
                    return piece; // Keep LTR text direction
                }
                // Reverse Arabic characters for proper rendering
                return piece.split('').reverse().join('');
            })
            .reverse()
            .join('');
    } catch (error) {
        console.warn("Arabic text processing error:", error);
        return str;
    }
};

// ============= Report Branding & Configuration =============

export interface ReportBranding {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    footerText: string;
}

const DEFAULT_BRANDING: ReportBranding = {
    companyName: "احجزلي",
    primaryColor: "#1E40AF", // Blue-700
    secondaryColor: "#059669", // Emerald-600
    accentColor: "#7C3AED", // Violet-600
    footerText: "AHJAZLY GO SYSTEM • 2024"
};

// ============= PDF Report Service =============

export interface PDFColumn {
    header: string;
    key: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    format?: (value: any) => string;
}

export interface PDFReportOptions {
    title: string;
    subtitle?: string;
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'a3' | 'letter';
    branding?: Partial<ReportBranding>;
    showHeader?: boolean;
    showFooter?: boolean;
    showPageNumbers?: boolean;
    showDate?: boolean;
    headerImage?: string;
    summaryData?: { label: string; value: string }[];
}

export class ReportService {
    private static instance: ReportService;
    private branding: ReportBranding = DEFAULT_BRANDING;
    
    private constructor() {}
    
    public static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService();
        }
        return ReportService.instance;
    }
    
    /**
     * Set custom branding for reports
     */
    public setBranding(branding: Partial<ReportBranding>): void {
        this.branding = { ...DEFAULT_BRANDING, ...branding };
    }
    
    /**
     * Initialize PDF document with Arabic font support
     */
    private initializePDF(options: PDFReportOptions): jsPDF {
        const doc = new jsPDF({
            orientation: options.orientation || 'portrait',
            unit: 'mm',
            format: options.pageSize || 'a4',
            putOnlyUsedFonts: true
        });
        
        // Load Noto Sans Arabic font
        try {
            if (NotoSansArabicBase64) {
                doc.addFileToVFS("NotoSansArabic-Regular.ttf", NotoSansArabicBase64);
                doc.addFont("NotoSansArabic-Regular.ttf", "NotoSansArabic", "normal");
                doc.setFont("NotoSansArabic");
            }
        } catch (error) {
            console.warn("Could not load Arabic font:", error);
        }
        
        return doc;
    }
    
    /**
     * Add professional header to PDF
     */
    private addHeader(doc: jsPDF, options: PDFReportOptions): number {
        const pageWidth = doc.internal.pageSize.getWidth();
        const branding = { ...this.branding, ...options.branding };
        let yPos = 15;
        
        // Company name and logo area
        doc.setFontSize(24);
        doc.setTextColor(30, 64, 175); // Blue
        doc.text(processArabicText(branding.companyName), pageWidth - 15, yPos, { align: 'right' });
        
        // Report title
        yPos += 12;
        doc.setFontSize(18);
        doc.setTextColor(30, 30, 30);
        doc.text(processArabicText(options.title), pageWidth - 15, yPos, { align: 'right' });
        
        // Subtitle if provided
        if (options.subtitle) {
            yPos += 8;
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(processArabicText(options.subtitle), pageWidth - 15, yPos, { align: 'right' });
        }
        
        // Export date
        if (options.showDate !== false) {
            yPos += 8;
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            const dateText = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                calendar: 'islamic'
            })}`;
            doc.text(processArabicText(dateText), pageWidth - 15, yPos, { align: 'right' });
        }
        
        // Divider line
        yPos += 5;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);
        
        return yPos + 10;
    }
    
    /**
     * Add summary cards to PDF
     */
    private addSummary(doc: jsPDF, summaryData: { label: string; value: string }[], startY: number): number {
        const pageWidth = doc.internal.pageSize.getWidth();
        const cardWidth = (pageWidth - 50) / Math.min(summaryData.length, 4);
        let xPos = pageWidth - 20;
        let yPos = startY;
        
        summaryData.slice(0, 4).forEach((item, index) => {
            // Card background
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(xPos - cardWidth + 5, yPos, cardWidth - 10, 25, 3, 3, 'F');
            
            // Value
            doc.setFontSize(14);
            doc.setTextColor(30, 30, 30);
            doc.text(processArabicText(item.value), xPos - cardWidth / 2, yPos + 10, { align: 'center' });
            
            // Label
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(processArabicText(item.label), xPos - cardWidth / 2, yPos + 19, { align: 'center' });
            
            xPos -= cardWidth;
        });
        
        return yPos + 35;
    }
    
    /**
     * Add footer to all pages
     */
    private addFooter(doc: jsPDF, options: PDFReportOptions): void {
        const pageCount = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const branding = { ...this.branding, ...options.branding };
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
            
            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(branding.footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Page number
            if (options.showPageNumbers !== false) {
                const pageText = `${i} / ${pageCount}`;
                doc.text(pageText, pageWidth - 15, pageHeight - 10, { align: 'right' });
            }
        }
    }
    
    /**
     * Generate professional PDF report with data table
     */
    public async generateTableReport(
        data: any[],
        columns: PDFColumn[],
        options: PDFReportOptions
    ): Promise<void> {
        if (!data || data.length === 0) {
            toast.error("لا توجد بيانات للتصدير");
            return;
        }
        
        try {
            const doc = this.initializePDF(options);
            
            // Add header
            let startY = options.showHeader !== false ? this.addHeader(doc, options) : 20;
            
            // Add summary if provided
            if (options.summaryData && options.summaryData.length > 0) {
                startY = this.addSummary(doc, options.summaryData, startY);
            }
            
            // Prepare columns (reverse for RTL)
            const rtlColumns = [...columns].reverse();
            
            // Prepare table headers
            const headers = [rtlColumns.map(col => processArabicText(col.header))];
            
            // Prepare table body
            const body = data.map(row =>
                rtlColumns.map(col => {
                    let value = row[col.key];
                    if (col.format) {
                        value = col.format(value);
                    }
                    return processArabicText(String(value ?? '-'));
                })
            );
            
            // Generate table
            autoTable(doc, {
                head: headers,
                body: body,
                startY: startY,
                theme: 'striped',
                styles: {
                    font: 'NotoSansArabic',
                    fontSize: 10,
                    halign: 'right',
                    cellPadding: 4,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [30, 64, 175],
                    textColor: [255, 255, 255],
                    fontStyle: 'normal',
                    fontSize: 11
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: Object.fromEntries(
                    rtlColumns.map((col, index) => [
                        index.toString(),
                        { 
                            halign: (col.align || 'right') as 'left' | 'center' | 'right',
                            cellWidth: col.width || 'auto'
                        }
                    ])
                ),
                didDrawPage: (data) => {
                    // Add header on each new page
                    if (data.pageNumber > 1 && options.showHeader !== false) {
                        this.addHeader(doc, { ...options, showDate: false });
                    }
                }
            });
            
            // Add footer
            if (options.showFooter !== false) {
                this.addFooter(doc, options);
            }
            
            // Save
            const filename = options.filename || 'report';
            doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("تم تصدير التقرير بنجاح");
            
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("حدث خطأ أثناء إنشاء التقرير");
        }
    }
    
    /**
     * Generate invoice-style PDF
     */
    public async generateInvoice(
        invoiceData: {
            invoiceNumber: string;
            date: string;
            dueDate?: string;
            clientName: string;
            clientAddress?: string;
            items: { description: string; quantity: number; unitPrice: number; total: number }[];
            subtotal: number;
            tax?: number;
            discount?: number;
            total: number;
            notes?: string;
        },
        options: Partial<PDFReportOptions> = {}
    ): Promise<void> {
        try {
            const doc = this.initializePDF({ 
                title: 'فاتورة', 
                orientation: 'portrait',
                ...options 
            });
            
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;
            
            // Header
            doc.setFontSize(28);
            doc.setTextColor(30, 64, 175);
            doc.text(processArabicText('فاتورة'), pageWidth - 20, yPos, { align: 'right' });
            
            // Invoice number
            yPos += 12;
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(processArabicText(`رقم الفاتورة: ${invoiceData.invoiceNumber}`), pageWidth - 20, yPos, { align: 'right' });
            
            // Dates
            yPos += 8;
            doc.setFontSize(10);
            doc.text(processArabicText(`تاريخ الإصدار: ${invoiceData.date}`), pageWidth - 20, yPos, { align: 'right' });
            
            if (invoiceData.dueDate) {
                yPos += 6;
                doc.text(processArabicText(`تاريخ الاستحقاق: ${invoiceData.dueDate}`), pageWidth - 20, yPos, { align: 'right' });
            }
            
            // Client info
            yPos += 15;
            doc.setFontSize(12);
            doc.setTextColor(30, 30, 30);
            doc.text(processArabicText('فاتورة إلى:'), pageWidth - 20, yPos, { align: 'right' });
            yPos += 7;
            doc.setFontSize(14);
            doc.text(processArabicText(invoiceData.clientName), pageWidth - 20, yPos, { align: 'right' });
            
            if (invoiceData.clientAddress) {
                yPos += 6;
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(processArabicText(invoiceData.clientAddress), pageWidth - 20, yPos, { align: 'right' });
            }
            
            // Items table
            yPos += 15;
            const columns = [
                { header: 'الإجمالي', key: 'total' },
                { header: 'سعر الوحدة', key: 'unitPrice' },
                { header: 'الكمية', key: 'quantity' },
                { header: 'الوصف', key: 'description' }
            ];
            
            const headers = [columns.map(col => processArabicText(col.header))];
            const body = invoiceData.items.map(item => [
                processArabicText(`${item.total.toLocaleString()} ر.س`),
                processArabicText(`${item.unitPrice.toLocaleString()} ر.س`),
                processArabicText(String(item.quantity)),
                processArabicText(item.description)
            ]);
            
            autoTable(doc, {
                head: headers,
                body: body,
                startY: yPos,
                theme: 'striped',
                styles: {
                    font: 'NotoSansArabic',
                    fontSize: 10,
                    halign: 'right',
                    cellPadding: 5
                },
                headStyles: {
                    fillColor: [30, 64, 175],
                    textColor: [255, 255, 255]
                }
            });
            
            // Totals
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const totalsX = 80;
            
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            
            let currentY = finalY;
            doc.text(processArabicText(`المجموع الفرعي: ${invoiceData.subtotal.toLocaleString()} ر.س`), totalsX, currentY, { align: 'right' });
            
            if (invoiceData.tax) {
                currentY += 7;
                doc.text(processArabicText(`الضريبة: ${invoiceData.tax.toLocaleString()} ر.س`), totalsX, currentY, { align: 'right' });
            }
            
            if (invoiceData.discount) {
                currentY += 7;
                doc.text(processArabicText(`الخصم: -${invoiceData.discount.toLocaleString()} ر.س`), totalsX, currentY, { align: 'right' });
            }
            
            currentY += 10;
            doc.setFontSize(14);
            doc.setTextColor(30, 64, 175);
            doc.text(processArabicText(`الإجمالي: ${invoiceData.total.toLocaleString()} ر.س`), totalsX, currentY, { align: 'right' });
            
            // Notes
            if (invoiceData.notes) {
                currentY += 20;
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(processArabicText('ملاحظات:'), pageWidth - 20, currentY, { align: 'right' });
                currentY += 6;
                doc.text(processArabicText(invoiceData.notes), pageWidth - 20, currentY, { align: 'right' });
            }
            
            // Footer
            this.addFooter(doc, { title: 'فاتورة', ...options });
            
            doc.save(`invoice_${invoiceData.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("تم إنشاء الفاتورة بنجاح");
            
        } catch (error) {
            console.error("Invoice generation error:", error);
            toast.error("حدث خطأ أثناء إنشاء الفاتورة");
        }
    }
    
    /**
     * Generate Excel report
     */
    public exportToExcel(
        data: any[],
        filename: string = 'report',
        sheetName: string = 'البيانات'
    ): void {
        if (!data || data.length === 0) {
            toast.error("لا توجد بيانات للتصدير");
            return;
        }
        
        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            
            // Set RTL direction for the sheet
            if (!ws['!cols']) ws['!cols'] = [];
            ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
            
            XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
            XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            toast.success("تم تصدير ملف Excel بنجاح");
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error("حدث خطأ أثناء التصدير");
        }
    }
    
    /**
     * Export multiple sheets to Excel
     */
    public exportMultiSheetExcel(
        sheets: { name: string; data: any[] }[],
        filename: string = 'report'
    ): void {
        try {
            const wb = XLSX.utils.book_new();
            
            sheets.forEach(sheet => {
                if (sheet.data && sheet.data.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(sheet.data);
                    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
                }
            });
            
            XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("تم تصدير الملف بنجاح");
        } catch (error) {
            console.error("Multi-sheet Excel export error:", error);
            toast.error("حدث خطأ أثناء التصدير");
        }
    }
}

// Export singleton instance
export const reportService = ReportService.getInstance();

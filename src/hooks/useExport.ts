import { reportService, processArabicText, PDFColumn, PDFReportOptions } from "@/lib/services/ReportService";
import { toast } from "sonner";

/**
 * useExport Hook
 * Provides simplified export functionality using the centralized ReportService
 */
export const useExport = () => {
    /**
     * Export data to Excel file
     */
    const exportToExcel = (data: any[], fileName: string = "report") => {
        reportService.exportToExcel(data, fileName);
    };

    /**
     * Export data to PDF with professional Arabic support
     */
    const exportToPDF = async (
        data: any[],
        columns: { header: string; key: string }[],
        options: {
            title?: string;
            filename?: string;
            landscape?: boolean;
            summaryData?: { label: string; value: string }[];
        } = {}
    ) => {
        const pdfColumns: PDFColumn[] = columns.map(col => ({
            header: col.header,
            key: col.key,
            align: 'right'
        }));

        await reportService.generateTableReport(data, pdfColumns, {
            title: options.title || 'تقرير',
            filename: options.filename || 'report',
            orientation: options.landscape ? 'landscape' : 'portrait',
            summaryData: options.summaryData,
            showHeader: true,
            showFooter: true,
            showPageNumbers: true,
            showDate: true
        });
    };

    /**
     * Generate professional invoice PDF
     */
    const exportInvoice = async (invoiceData: {
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
    }) => {
        await reportService.generateInvoice(invoiceData);
    };

    /**
     * Export multiple sheets to Excel
     */
    const exportMultiSheet = (
        sheets: { name: string; data: any[] }[],
        filename: string = "report"
    ) => {
        reportService.exportMultiSheetExcel(sheets, filename);
    };

    return { 
        exportToExcel, 
        exportToPDF, 
        exportInvoice,
        exportMultiSheet,
        // Expose the service for advanced usage
        reportService,
        processArabicText
    };
};

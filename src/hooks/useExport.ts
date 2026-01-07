import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import ArabicReshaper from 'arabic-reshaper';
import { NotoSansArabicBase64 } from "@/assets/fonts/noto-sans-arabic";

// Helper to handle Arabic text shaping and RTL reversal for jsPDF
const prepareArabicText = (text: string): string => {
    if (!text) return "";

    // 1. Reshape Arabic characters
    // @ts-ignore
    const reshaped = ArabicReshaper.convertArabic(text);

    // 2. Simple but Effective Reversal
    // For jsPDF to show RTL correctly in an LTR context, 
    // we must reverse the character sequence of the ENTIRE reshaped string.
    // However, we want to keep English words/Numbers LTR.

    // We'll split by LTR segments (Latin + Numbers + Punctuation)
    const ltrRegex = /([a-zA-Z0-9@._\-\+:]+)/g;
    const pieces = reshaped.split(ltrRegex);

    // Reverse the sequence of pieces AND reverse characters of NOT-LTR pieces
    return pieces
        .map(piece => {
            if (piece.match(ltrRegex)) {
                return piece; // Keep English/Numbers as is
            }
            // Reverse Arabic characters
            return piece.split('').reverse().join('');
        })
        .reverse()
        .join('');
};

interface ExportOptions {
    filename?: string;
    title?: string;
    landscape?: boolean;
}

export const useExport = () => {
    const exportToExcel = (data: any[], fileName: string = "report") => {
        try {
            if (!data || data.length === 0) {
                toast.error("لا توجد بيانات للتصدير");
                return;
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.success("تم تصدير ملف Excel بنجاح");
        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("حدث خطأ أثناء تصدير ملف Excel");
        }
    };

    const exportToPDF = async (
        data: any[],
        columns: { header: string; key: string }[],
        options: ExportOptions = {}
    ) => {
        try {
            if (!data || data.length === 0) {
                toast.error("لا توجد بيانات للتصدير");
                return;
            }

            const {
                filename = "report",
                title = "تقرير",
                landscape = false
            } = options;

            const doc = new jsPDF({
                orientation: landscape ? "landscape" : "portrait",
                unit: "mm",
                format: "a4",
                putOnlyUsedFonts: true
            });

            // Load Custom Font (Noto Sans Arabic) for Robust Arabic Support
            try {
                if (NotoSansArabicBase64) {
                    doc.addFileToVFS("NotoSansArabic.ttf", NotoSansArabicBase64);
                    doc.addFont("NotoSansArabic.ttf", "NotoSans", "normal");
                    doc.setFont("NotoSans");
                } else {
                    throw new Error("Local font data is missing");
                }
            } catch (fontError) {
                console.warn("Could not load local Arabic font:", fontError);
                toast.warning("تعذر تحميل الخط العربي المحلي، قد تظهر الحروف بشكل غير صحيح");
            }

            doc.setFont("NotoSans", "normal");
            doc.setFontSize(22);

            // Render title (reshaped and reversed)
            const preparedTitle = prepareArabicText(title);
            doc.text(preparedTitle, doc.internal.pageSize.width / 2, 20, { align: "center" });

            doc.setFontSize(12);
            const exportDateText = `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`;
            doc.text(
                prepareArabicText(exportDateText),
                doc.internal.pageSize.width / 2,
                30,
                { align: "center" }
            );

            // IMPORTANT for RTL: Reverse the columns array
            const rtlColumns = [...columns].reverse();

            // Prepare table data with reshaped and reversed text
            const tableBody = data.map((row) =>
                rtlColumns.map((col) => {
                    const val = row[col.key];
                    const text = val !== null && val !== undefined ? String(val) : "-";
                    return prepareArabicText(text);
                })
            );

            const tableHeaders = [rtlColumns.map((c) => prepareArabicText(c.header))];

            // Generate Table
            autoTable(doc, {
                head: tableHeaders,
                body: tableBody,
                startY: 40,
                theme: "striped",
                styles: {
                    font: "NotoSans",
                    fontSize: 10,
                    halign: 'right',
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [66, 66, 66],
                    textColor: 255,
                    fontStyle: 'normal'
                },
                columnStyles: {
                    // Force RTL alignment for all columns
                    0: { halign: 'right' },
                    1: { halign: 'right' },
                    2: { halign: 'right' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                },
            });

            doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("تم تصدير ملف PDF بنجاح");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("حدث خطأ أثناء تصدير ملف PDF");
        }
    };

    return { exportToExcel, exportToPDF };
};


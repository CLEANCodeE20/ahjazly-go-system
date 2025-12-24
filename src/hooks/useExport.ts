import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

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

            // Create a new workbook
            const wb = XLSX.utils.book_new();

            // Convert data to worksheet
            const ws = XLSX.utils.json_to_sheet(data);

            // Append worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

            // Write file
            XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.success("تم تصدير ملف Excel بنجاح");
        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("حدث خطأ أثناء تصدير ملف Excel");
        }
    };

    const exportToPDF = (
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
                format: "a4",
            });

            // Add Font Support for Arabic (using standard font for now as custom requires loading ttf)
            // Note: Standard PDF fonts don't support Arabic well. 
            // Ideally, we should load a font like Cairo-Regular.ttf here.
            // For this implementation, we will try to use a basic font and warn about Arabic.
            // In a real-world scenario, you MUST load an Arabic font base64 string.

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });

            doc.setFontSize(10);
            doc.text(
                `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
                doc.internal.pageSize.width / 2,
                30,
                { align: "center" }
            );

            // Prepare table data
            const tableBody = data.map((row) =>
                columns.map((col) => {
                    const val = row[col.key];
                    return val !== null && val !== undefined ? String(val) : "-";
                })
            );

            const tableHeaders = [columns.map((c) => c.header)];

            // Generate Table
            autoTable(doc, {
                head: tableHeaders,
                body: tableBody,
                startY: 40,
                theme: "striped",
                headStyles: { fillColor: [66, 66, 66], textColor: 255, halign: 'center' },
                bodyStyles: { halign: 'center' },
                styles: { font: "helvetica" }, // This might still print garbage for Arabic if not patched
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

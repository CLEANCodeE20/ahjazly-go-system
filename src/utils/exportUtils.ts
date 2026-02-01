/**
 * أدوات التصدير للتقارير
 * وظائف لتصدير التقارير إلى PDF و Excel و CSV
 */

// وظيفة لتصدير إلى PDF
export const exportToPdf = async (
    elementId: string,
    filename: string = 'تقرير.pdf'
): Promise<void> => {
    try {
        // التحقق مما إذا كانت مكتبة jsPDF متوفرة
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.jsPDF;
        
        // التحقق من وجود العنصر
        const element = document.getElementById(elementId);
        if (!element) {
            throw new Error('لم يتم العثور على العنصر');
        }

        // إنشاء مستند PDF جديد
        const pdf = new jsPDF('p', 'mm', 'a4');
        const elementHtml = element.innerHTML;
        const elementStyles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    // إذا كان هناك خطأ في قراءة stylesheet من مصدر خارجي
                    return '';
                }
            })
            .join('\n');

        // تحويل العنصر إلى Canvas ثم إلى PDF
        import('html2canvas').then(html2canvas => {
            html2canvas.default(element).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = 20;
                
                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save(filename);
            });
        });
    } catch (error) {
        console.error('خطأ في تصدير PDF:', error);
        // محاولة استخدام وظيفة طباعة احتياطية
        window.print();
    }
};

// وظيفة لتصدير إلى Excel
export const exportToExcel = (
    data: any[],
    filename: string = 'تقرير.xlsx',
    sheetName: string = 'تقرير'
): void => {
    try {
        import('xlsx').then(XLSX => {
            // إنشاء ورقة عمل من البيانات
            const worksheet = XLSX.utils.json_to_sheet(data);
            
            // إنشاء كتاب عمل
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            
            // تعيين خصائص الملف
            workbook.Props = {
                Title: filename.replace('.xlsx', ''),
                Subject: 'تقرير',
                Author: 'نظام أحداثي',
                CreatedDate: new Date()
            };
            
            // حفظ الملف
            XLSX.writeFile(workbook, filename);
        });
    } catch (error) {
        console.error('خطأ في تصدير Excel:', error);
        throw error;
    }
};

// وظيفة لتصدير إلى CSV
export const exportToCsv = (
    data: any[],
    filename: string = 'تقرير.csv'
): void => {
    try {
        if (!data || data.length === 0) {
            throw new Error('لا توجد بيانات للتصدير');
        }

        // الحصول على عناوين الأعمدة من المفتاح الأول
        const headers = Object.keys(data[0]);
        
        // إنشاء سطر العناوين
        const headerRow = headers.join(',');
        
        // إنشاء باقي الأسطر
        const rows = data.map(row => {
            return headers.map(header => {
                let value = row[header];
                
                // التعامل مع القيم التي تحتوي على فواصل أو أقواس
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                
                return value;
            }).join(',');
        });
        
        // دمج كل شيء
        const csvContent = [headerRow, ...rows].join('\n');
        
        // إنشاء ملف CSV
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('خطأ في تصدير CSV:', error);
        throw error;
    }
};

// وظيفة لتحويل الجدول إلى بيانات قابلة للتصدير
export const tableToExportData = (tableElement: HTMLTableElement): any[] => {
    const rows = Array.from(tableElement.rows);
    const headers = Array.from(rows[0].cells).map(cell => cell.textContent || '');
    
    return rows.slice(1).map(row => {
        const rowData: any = {};
        Array.from(row.cells).forEach((cell, index) => {
            rowData[headers[index]] = cell.textContent || '';
        });
        return rowData;
    });
};

// وظيفة لتصدير جزء من الصفحة
export const exportSectionToPdf = async (
    selector: string,
    filename: string = 'تقرير.pdf'
): Promise<void> => {
    try {
        const element = document.querySelector(selector) as HTMLElement;
        if (!element) {
            throw new Error(`لم يتم العثور على العنصر ${selector}`);
        }

        // إنشاء نسخة مؤقتة من العنصر مع التنسيقات الكاملة
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = element.innerHTML;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '210mm';
        tempContainer.style.padding = '15mm';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.direction = 'rtl';
        document.body.appendChild(tempContainer);

        // تطبيق التنسيقات من ملفات CSS
        const styleSheets = Array.from(document.styleSheets);
        const styles = styleSheets.map(sheet => {
            try {
                return Array.from((sheet as CSSStyleSheet).cssRules || [])
                    .map(rule => rule.cssText)
                    .join('\n');
            } catch (e) {
                return '';
            }
        }).join('\n');

        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        tempContainer.prepend(styleTag);

        await exportToPdf(tempContainer.id || 'temp-export', filename);
        
        document.body.removeChild(tempContainer);
    } catch (error) {
        console.error('خطأ في تصدير القسم إلى PDF:', error);
        throw error;
    }
};
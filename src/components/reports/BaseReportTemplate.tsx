/**
 * قالب تقرير موحد - قاعدة لجميع التقارير في النظام
 */
import React, { ReactNode } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useReportConfig } from '../../contexts/ReportContext';
import { ArabicFormatter } from '../../utils/formatters/ArabicFormatter';
import { QRCodeGenerator } from '../../utils/qrcode/QRCodeGenerator';
import '../../styles/reports/base.css';
import '../../styles/reports/print.css';

interface BaseReportTemplateProps {
    title: string;
    children: ReactNode;
    showPrintButton?: boolean;
    showExportButtons?: boolean;
    additionalActions?: ReactNode;
    includeQRCode?: boolean;
    includeCompanyInfo?: boolean;
    includeReportInfo?: boolean;
    className?: string;
}

export const BaseReportTemplate: React.FC<BaseReportTemplateProps> = ({
    title,
    children,
    showPrintButton = true,
    showExportButtons = true,
    additionalActions,
    includeQRCode = false,
    includeCompanyInfo = true,
    includeReportInfo = true,
    className = '',
}) => {
    const { config } = useReportConfig();
    const [qrCode, setQRCode] = React.useState<string>('');

    React.useEffect(() => {
        if (includeQRCode) {
            const generateQR = async () => {
                try {
                    const qrData = `${config.reportInfo.title}:${config.reportInfo.number || 'N/A'}|DATE:${config.reportInfo.date.toISOString()}`;
                    const qr = await QRCodeGenerator.generateTextQR(qrData, 150);
                    setQRCode(qr);
                } catch (error) {
                    console.error('Error generating QR:', error);
                }
            };
            generateQR();
        }
    }, [includeQRCode, config]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = async () => {
        const element = document.querySelector('.report-container') as HTMLElement;
        if (!element) return;

        try {
            // Hide actions during capture
            const actions = document.querySelector('.report-actions') as HTMLElement;
            if (actions) actions.style.display = 'none';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Restore actions
            if (actions) actions.style.display = '';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('حدث خطأ أثناء تصدير PDF');
        }
    };

    const handleExportExcel = () => {
        // سيتم تنفيذها لاحقاً
        alert('تصدير Excel قيد التطوير');
    };

    const handleExportCsv = () => {
        // سيتم تنفيذها لاحقاً
        alert('تصدير CSV قيد التطوير');
    };

    return (
        <div className={`report-wrapper ${className}`}>
            {(showPrintButton || showExportButtons || additionalActions) && (
                <div className="report-actions no-print">
                    <div className="action-buttons">
                        {showPrintButton && (
                            <button onClick={handlePrint} className="btn btn-primary">
                                🖨️ طباعة
                            </button>
                        )}

                        {showExportButtons && (
                            <div className="export-buttons">
                                {config.exportOptions.includePdf && (
                                    <button onClick={handleExportPdf} className="btn btn-secondary">
                                        📄 PDF
                                    </button>
                                )}
                                {config.exportOptions.includeExcel && (
                                    <button onClick={handleExportExcel} className="btn btn-secondary">
                                        📊 Excel
                                    </button>
                                )}
                                {config.exportOptions.includeCsv && (
                                    <button onClick={handleExportCsv} className="btn btn-secondary">
                                        📋 CSV
                                    </button>
                                )}
                            </div>
                        )}

                        {additionalActions}
                    </div>
                </div>
            )}

            <div className="report-container base-report">
                {/* الرأس */}
                <header className="report-header">
                    {includeCompanyInfo && (
                        <div className="company-section">
                            {config.companyInfo.logo && (
                                <img
                                    src={config.companyInfo.logo}
                                    alt={config.companyInfo.name}
                                    className="logo"
                                />
                            )}
                            <h1 className="company-name">{config.companyInfo.name}</h1>

                            {config.companyInfo.address && (
                                <p className="text-muted company-address">
                                    {config.companyInfo.address}
                                    {config.companyInfo.city && `, ${config.companyInfo.city}`}
                                </p>
                            )}

                            {config.companyInfo.phone && (
                                <p className="text-muted">
                                    هاتف: {ArabicFormatter.formatPhone(config.companyInfo.phone)}
                                </p>
                            )}

                            {config.companyInfo.email && (
                                <p className="text-muted">
                                    بريد: {config.companyInfo.email}
                                </p>
                            )}

                            {config.companyInfo.vatNumber && (
                                <p className="text-muted">
                                    الرقم الضريبي: {config.companyInfo.vatNumber}
                                </p>
                            )}

                            {config.companyInfo.crNumber && (
                                <p className="text-muted">
                                    السجل التجاري: {config.companyInfo.crNumber}
                                </p>
                            )}
                        </div>
                    )}

                    {includeReportInfo && (
                        <div className="report-info">
                            <h2 className="report-title">{title}</h2>
                            <div className="meta-info">
                                {config.reportInfo.number && (
                                    <p><strong>رقم التقرير:</strong> {config.reportInfo.number}</p>
                                )}

                                <p><strong>التاريخ:</strong> {ArabicFormatter.formatDate(config.reportInfo.date)}</p>

                                {config.reportInfo.period && (
                                    <>
                                        <p><strong>من:</strong> {ArabicFormatter.formatDate(config.reportInfo.period.from)}</p>
                                        <p><strong>إلى:</strong> {ArabicFormatter.formatDate(config.reportInfo.period.to)}</p>
                                    </>
                                )}

                                {config.reportInfo.status && (
                                    <p><strong>الحالة:</strong> <span className="status-badge status-info">{config.reportInfo.status}</span></p>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <hr className="divider" />

                {/* المحتوى */}
                <main className="report-content">
                    {children}
                </main>

                {/* QR Code */}
                {includeQRCode && qrCode && (
                    <section className="qr-section">
                        <img src={qrCode} alt="QR Code" className="qr-code" />
                        <p className="qr-label text-muted text-small">
                            امسح للتحقق من التقرير
                        </p>
                    </section>
                )}

                {/* التذييل */}
                <footer className="report-footer">
                    <div className="footer-content">
                        <p className="text-muted text-small">
                            تم إنشاء هذا التقرير في {ArabicFormatter.formatDateTime(new Date())}
                        </p>

                        {config.design.rtl ? (
                            <p className="text-muted text-small print-only">
                                تقرير {config.companyInfo.name} - {ArabicFormatter.formatDate(new Date())}
                            </p>
                        ) : (
                            <p className="text-muted text-small print-only">
                                {ArabicFormatter.formatDate(new Date())} - Report for {config.companyInfo.name}
                            </p>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};
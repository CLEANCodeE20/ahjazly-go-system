/**
 * تقرير الشركاء المعتمدين - النسخة الاحترافية (المعيار الذهبي)
 * توازن بصري كامل وتنسيق إداري رفيع
 */

import React, { useState } from 'react';
import { ArabicFormatter } from '@/utils/formatters/ArabicFormatter';
import '@/styles/reports/base.css';
import '@/styles/reports/print.css';
import './PartnersReport.css';

export interface PartnerReportData {
    partners: any[];
    company: {
        name: string;
        logo?: string;
        address: string;
        phone: string;
        email: string;
    };
    reportTitle: string;
    generatedDate: Date;
}

interface PartnersReportProps {
    data: PartnerReportData;
    onClose: () => void;
}

export const PartnersReport: React.FC<PartnersReportProps> = ({
    data,
    onClose
}) => {
    const [logoError, setLogoError] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="partners-report-wrapper fixed inset-0 z-[99999] bg-slate-100 overflow-y-auto" dir="rtl">
            {/* شريط التحكم - يختفي عند الطباعة */}
            <div className="report-actions no-print sticky top-0 bg-white border-b p-4 flex justify-between items-center px-12 shadow-md z-[100]">
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-lg">تحرير التقرير الرسمي (A4)</span>
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Official Document Preview</span>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700 transition-all font-black shadow-lg active:scale-95 flex items-center gap-3"
                    >
                        <span className="text-xl">🖨️</span>
                        إصدار وطباعة المستند
                    </button>
                </div>

                <div className="instruction-box bg-blue-50 border-r-4 border-blue-500 p-2 px-4 rounded">
                    <p className="text-[11px] text-blue-900 font-bold leading-tight">
                        💡 للحصول على مظهر احترافي (بدون روابط المتصفح):<br />
                        <span className="text-slate-600 font-normal">من إعدادات الطباعة، قم بإلغاء خيار <b>"الرؤوس والتذييلات"</b> وتفعيل <b>"خلفيات الرسومات"</b>.</span>
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all font-bold"
                >
                    ✕
                </button>
            </div>

            {/* الحاوية الرئيسية للمستند */}
            <div className="document-sheet mx-auto my-12 print:my-0 bg-white shadow-2xl print:shadow-none w-[210mm] min-h-[297mm] relative p-[15mm] flex flex-col">

                {/* رأس المستند (Header) */}
                <header className="document-header flex justify-between items-start border-b-[3px] border-slate-900 pb-8 mb-10">
                    {/* الجهة اليمنى: بيانات المنصة */}
                    <div className="company-side flex flex-col items-start text-right">
                        <div className="flex items-center gap-4 mb-4">
                            {data.company.logo && !logoError ? (
                                <img
                                    src={data.company.logo}
                                    alt="Logo"
                                    className="h-20 w-auto object-contain"
                                    onError={() => setLogoError(true)}
                                />
                            ) : (
                                <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-black">
                                    H
                                </div>
                            )}
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-black text-blue-800 leading-none">{data.company.name}</h2>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Smart Solutions & Logistics</span>
                            </div>
                        </div>
                        <div className="contact-details text-[11px] text-slate-500 space-y-0.5 font-bold">
                            <p>{data.company.address}</p>
                            <p>هاتف: {ArabicFormatter.formatPhone(data.company.phone)}</p>
                            <p>بريد: {data.company.email}</p>
                        </div>
                    </div>

                    {/* الجهة اليسرى: عنوان التقرير */}
                    <div className="title-side text-left flex flex-col items-end">
                        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{data.reportTitle}</h1>
                        <div className="meta-info bg-slate-50 p-4 rounded-xl border-r-8 border-blue-600 w-full max-w-[240px]">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-400 font-bold">تاريخ الإصدار:</span>
                                <span className="text-xs font-black text-slate-800">{ArabicFormatter.formatDate(data.generatedDate)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-400 font-bold">إجمالي الشركات:</span>
                                <span className="text-xs font-black text-slate-800">{data.partners.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-bold">كود المستند:</span>
                                <span className="text-xs font-black text-blue-600">REP-PART-26</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* جسم المستند (Table) */}
                <main className="document-body flex-grow">
                    <table className="official-data-table w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="w-[40px] p-3 text-center text-[10px] font-black uppercase">#</th>
                                <th className="p-3 text-right text-[10px] font-black uppercase">الشركة / المعرف الضريبي</th>
                                <th className="p-3 text-right text-[10px] font-black uppercase">المسؤول الإداري</th>
                                <th className="w-[80px] p-3 text-center text-[10px] font-black uppercase">العمولة</th>
                                <th className="w-[90px] p-3 text-center text-[10px] font-black uppercase">الحالة</th>
                                <th className="w-[120px] p-3 text-center text-[10px] font-black uppercase">تاريخ الانضمام</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.partners.map((partner, index) => (
                                <tr key={partner.partner_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-3 text-center text-[10px] font-mono text-slate-400">{index + 1}</td>
                                    <td className="p-3">
                                        <div className="font-black text-slate-800 text-[12px]">{partner.company_name}</div>
                                        <div className="text-[9px] text-slate-400 font-mono">ID: {String(partner.partner_id).padStart(4, '0')}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-bold text-slate-700 text-[11px]">{partner.manager?.full_name || partner.contact_person || '-'}</div>
                                        <div className="text-[9px] text-slate-400 font-mono" dir="ltr">{partner.manager?.phone_number || '-'}</div>
                                    </td>
                                    <td className="p-3 text-center font-black text-blue-700 text-[12px]">
                                        {partner.commission_percentage}%
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${partner.status === 'approved'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {partner.status === 'approved' ? 'نشط' : 'موقف'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center text-[10px] font-bold text-slate-500" dir="ltr">
                                        {ArabicFormatter.formatDate(partner.created_at || new Date(), 'short')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>

                {/* تذييل المستند (Footer) */}
                <footer className="document-footer mt-auto pt-8 border-t-[1px] border-slate-200">
                    <div className="flex justify-between items-end">
                        <div className="legal-info text-[9px] text-slate-400 space-y-1">
                            <p className="font-black text-slate-500">تم إنتاج هذا التقرير آلياً بواسطة نظام إدارة منصة احجزلي الموحد.</p>
                            <p>تخضع كافة البيانات المذكورة أعلاه لتدقيق دوري من قبل إدارة الشركاء.</p>
                            <p className="text-slate-300 italic">Auth Token: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>

                        <div className="pagination bg-slate-50 border border-slate-200 px-6 py-2 rounded-full text-[11px] font-black text-slate-800 shadow-sm">
                            الصفحة رقم <span className="page-number-val"></span>
                        </div>

                        <div className="signature-box flex flex-col items-center gap-2">
                            <div className="h-12 w-48 border-b-2 border-slate-200 border-dashed"></div>
                            <span className="text-[10px] font-black text-slate-600">توقيع المسؤول والختم الرسمي</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

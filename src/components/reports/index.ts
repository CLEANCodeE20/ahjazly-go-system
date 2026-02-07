/**
 * ملف التصدير النهائي لجميع مكونات التقارير
 */

// الفاتورة
export { Invoice } from './Invoice/Invoice';
export type { InvoiceData, InvoiceItem } from './Invoice/Invoice';

// تقرير الحجز
export { BookingReport } from './BookingReport/BookingReport';
export type { BookingReportData, Passenger } from './BookingReport/BookingReport';

// كشف ركاب الرحلة
export { TripManifest } from './TripManifest/TripManifest';
export type { TripManifestData, ManifestPassenger } from './TripManifest/TripManifest';

// كشف حساب الشريك
export { PartnerStatement } from './PartnerStatement/PartnerStatement';
export type { PartnerStatementData, StatementTransaction } from './PartnerStatement/PartnerStatement';

// تقرير الرحلات
export { TripsReport } from './TripsReport';

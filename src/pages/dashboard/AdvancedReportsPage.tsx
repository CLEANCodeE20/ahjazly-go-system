import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { BaseReportTemplate } from "@/components/reports/BaseReportTemplate";
import { ReportProvider } from "@/contexts/ReportContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { arSA } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

type ReportType = 'operations' | 'bookings' | 'finance' | 'refunds' | 'executive';

const AdvancedReportsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialType = searchParams.get('type') as ReportType | null;
    const [reportType, setReportType] = useState<ReportType>(initialType || 'operations');
    const [period, setPeriod] = useState('month');

    // Update URL when report type changes
    const handleReportTypeChange = (value: ReportType) => {
        setReportType(value);
        setSearchParams({ type: value });
    };

    // Dynamic configuration based on report type
    const reportConfig = useMemo(() => {
        switch (reportType) {
            case 'operations': return { tableName: 'reports_trips_operations', pk: 'trip_id', dateCol: 'departure_time' };
            case 'bookings': return { tableName: 'reports_booking_management', pk: 'booking_id', dateCol: 'booking_date' };
            case 'finance': return { tableName: 'reports_financial_transactions', pk: 'ledger_id', dateCol: 'transaction_date' };
            case 'refunds': return { tableName: 'reports_refund_processing', pk: 'refund_id', dateCol: 'request_date' };
            case 'executive': return { tableName: 'reports_executive_summary', pk: 'report_month', dateCol: 'report_month' };
            default: return { tableName: 'reports_trips_operations', pk: 'trip_id', dateCol: 'departure_time' };
        }
    }, [reportType]);

    // Filter logic
    const filterQuery = useMemo(() => {
        return (query: any) => {
            const now = new Date();
            let start, end;

            switch (period) {
                case 'week':
                    start = startOfWeek(now, { weekStartsOn: 6 });
                    end = endOfWeek(now, { weekStartsOn: 6 });
                    break;
                case 'month':
                    start = startOfMonth(now);
                    end = endOfMonth(now);
                    break;
                case 'year':
                    start = startOfYear(now);
                    end = endOfYear(now);
                    break;
                default:
                    return query;
            }

            if (start && end && reportConfig.dateCol) {
                return query.gte(reportConfig.dateCol, start.toISOString()).lte(reportConfig.dateCol, end.toISOString());
            }
            return query;
        };
    }, [period, reportConfig.dateCol]);

    // Single hook that updates when configuration changes
    const {
        data,
        loading,
        refetch,
        page,
        setPage,
        totalPages,
        count
    } = useSupabaseCRUD<any>({
        tableName: reportConfig.tableName as any,
        primaryKey: reportConfig.pk,
        initialFetch: true,
        pageSize: 10,
        filter: filterQuery
    });

    const handleRefresh = () => {
        refetch();
    };

    const safeFormat = (dateStr: string | null | undefined, formatStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            return format(date, formatStr, { locale: arSA });
        } catch (e) {
            return '-';
        }
    };

    const getReportTitle = () => {
        switch (reportType) {
            case 'operations': return 'تقرير العمليات التشغيلية';
            case 'bookings': return 'تقرير إدارة الحجوزات';
            case 'finance': return 'تقرير المعاملات المالية';
            case 'refunds': return 'تقرير معالجة الاسترداد';
            case 'executive': return 'الملخص التنفيذي';
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
                <div className="text-sm text-muted-foreground">
                    عرض الصفحة {page} من {totalPages} (إجمالي {count} سجل)
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                            >
                                <ChevronRight className="h-4 w-4 ml-2" />
                                السابق
                            </Button>
                        </PaginationItem>

                        {/* Simple pagination for now, can be enhanced */}
                        <PaginationItem>
                            <span className="px-4 text-sm font-medium">{page}</span>
                        </PaginationItem>

                        <PaginationItem>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                            >
                                التالي
                                <ChevronLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">جاري تحميل البيانات...</p>
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <p>لا توجد بيانات للعرض في هذه الفترة</p>
                </div>
            );
        }

        switch (reportType) {
            case 'operations':
                return (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-right">رقم الرحلة</TableHead>
                                    <TableHead className="text-right">المسار</TableHead>
                                    <TableHead className="text-right">الموعد</TableHead>
                                    <TableHead className="text-right">الحافلة</TableHead>
                                    <TableHead className="text-right">السائق</TableHead>
                                    <TableHead className="text-right">المقاعد المتاحة</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((trip: any) => (
                                    <TableRow key={trip.trip_id}>
                                        <TableCell className="font-medium">#{trip.trip_id}</TableCell>
                                        <TableCell>{trip.origin_city} ⬅ {trip.destination_city}</TableCell>
                                        <TableCell dir="ltr">{safeFormat(trip.departure_time, 'yyyy-MM-dd HH:mm')}</TableCell>
                                        <TableCell>{trip.plate_number}</TableCell>
                                        <TableCell>{trip.driver_name}</TableCell>
                                        <TableCell>
                                            <Badge variant={trip.available_seats > 0 ? "outline" : "destructive"} className={trip.available_seats > 0 ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                                {trip.available_seats} مقعد
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {trip.trip_status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                );

            case 'bookings':
                // Calculate stats for the manifest-style view
                const totalBookings = data.length;
                const confirmedBookings = data.filter((b: any) => b.booking_status === 'confirmed').length;
                const totalRevenue = data.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
                const occupancyRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

                return (
                    <div className="space-y-6">
                        {/* Stats Grid - Manifest Style */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-card p-4 rounded-xl border-2 border-border text-center shadow-sm">
                                <div className="text-3xl font-bold text-foreground mb-1">{totalBookings}</div>
                                <div className="text-xs font-semibold text-muted-foreground">إجمالي الحجوزات</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 text-center shadow-sm">
                                <div className="text-3xl font-bold text-green-700 mb-1">{confirmedBookings}</div>
                                <div className="text-xs font-semibold text-green-600">حجز مؤكد</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 text-center shadow-sm">
                                <div className="text-3xl font-bold text-blue-700 mb-1">{occupancyRate}%</div>
                                <div className="text-xs font-semibold text-blue-600">نسبة التأكيد</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200 text-center shadow-sm">
                                <div className="text-3xl font-bold text-purple-700 mb-1 dir-ltr">{totalRevenue.toLocaleString()}</div>
                                <div className="text-xs font-semibold text-purple-600">الإيرادات (ر.س)</div>
                            </div>
                        </div>

                        {/* Manifest Table */}
                        <div className="rounded-md border-2 border-primary/20 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-primary text-primary-foreground hover:bg-primary">
                                    <TableRow className="hover:bg-primary border-b-0">
                                        <TableHead className="text-right text-primary-foreground font-bold">رقم الحجز</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold">العميل</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold">المسار</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold">التاريخ</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold">المبلغ</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold">طريقة الدفع</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold no-print">الحالة</TableHead>
                                        <TableHead className="text-right text-primary-foreground font-bold print-only w-[100px]">التوقيع</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((bk: any) => (
                                        <TableRow key={bk.booking_id} className="hover:bg-muted/50 border-b border-border">
                                            <TableCell className="font-bold text-center bg-primary/5 text-primary rounded-md m-1 inline-block w-16">
                                                #{bk.booking_id}
                                            </TableCell>
                                            <TableCell className="font-semibold">{bk.customer_name}</TableCell>
                                            <TableCell>{bk.route_name}</TableCell>
                                            <TableCell dir="ltr" className="text-muted-foreground">{safeFormat(bk.booking_date, 'yyyy-MM-dd')}</TableCell>
                                            <TableCell className="font-bold text-green-600">{bk.total_price} ر.س</TableCell>
                                            <TableCell>{bk.payment_method}</TableCell>
                                            <TableCell className="no-print">
                                                <Badge variant={bk.booking_status === 'confirmed' ? "default" : "secondary"} className={bk.booking_status === 'confirmed' ? "bg-green-600 hover:bg-green-700" : ""}>
                                                    {bk.booking_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="print-only border-b border-gray-300 h-10"></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Print Only Footer Signatures */}
                        <div className="hidden print:flex justify-around mt-12 pt-8 border-t-2 border-gray-200">
                            <div className="text-center min-w-[200px]">
                                <div className="h-16 border-b-2 border-gray-800 mb-2"></div>
                                <div className="font-bold text-gray-600">توقيع المحاسب</div>
                            </div>
                            <div className="text-center min-w-[200px]">
                                <div className="h-16 border-b-2 border-gray-800 mb-2"></div>
                                <div className="font-bold text-gray-600">توقيع المدير المالي</div>
                            </div>
                        </div>
                    </div>
                );

            case 'finance':
                return (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-right">رقم القيد</TableHead>
                                    <TableHead className="text-right">التاريخ</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">الوصف</TableHead>
                                    <TableHead className="text-right">المبلغ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((tx: any) => (
                                    <TableRow key={tx.ledger_id}>
                                        <TableCell className="font-medium">#{tx.ledger_id}</TableCell>
                                        <TableCell dir="ltr">{safeFormat(tx.transaction_date, 'yyyy-MM-dd HH:mm')}</TableCell>
                                        <TableCell>{tx.entry_type}</TableCell>
                                        <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                                        <TableCell className={`font-bold dir-ltr text-right ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.amount} SAR
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                );

            case 'refunds':
                return (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-right">رقم الطلب</TableHead>
                                    <TableHead className="text-right">تاريخ الطلب</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">المبلغ</TableHead>
                                    <TableHead className="text-right">وقت المعالجة</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((ref: any) => (
                                    <TableRow key={ref.refund_id}>
                                        <TableCell className="font-medium">#{ref.refund_id}</TableCell>
                                        <TableCell dir="ltr">{safeFormat(ref.request_date, 'yyyy-MM-dd')}</TableCell>
                                        <TableCell>{ref.customer_name}</TableCell>
                                        <TableCell className="font-bold">{ref.refund_amount} ر.س</TableCell>
                                        <TableCell>{ref.processing_time_hours ? `${ref.processing_time_hours.toFixed(1)} ساعة` : '-'}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={ref.status === 'completed' ? "default" : ref.status === 'pending' ? "secondary" : "destructive"}
                                                className={ref.status === 'completed' ? "bg-green-600" : ref.status === 'pending' ? "bg-orange-500" : ""}
                                            >
                                                {ref.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                );

            case 'executive':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {data.map((summary: any, idx: number) => (
                                <Card key={idx} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-bold">{safeFormat(summary.report_month, 'MMMM yyyy')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">إجمالي الحجوزات</span>
                                                <span className="font-bold text-lg">{summary.total_bookings}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">الإيرادات</span>
                                                <span className="font-bold text-lg text-green-600">{summary.gross_revenue} ر.س</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">معدل الإلغاء</span>
                                                <Badge variant={summary.cancellation_rate > 20 ? "destructive" : "secondary"}>
                                                    {summary.cancellation_rate}%
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <ReportProvider>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Controls Header */}
                <Card className="p-4 no-print">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium whitespace-nowrap">نوع التقرير:</span>
                                <Select value={reportType} onValueChange={(v) => handleReportTypeChange(v as ReportType)}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="operations">العمليات التشغيلية</SelectItem>
                                        <SelectItem value="bookings">إدارة الحجوزات</SelectItem>
                                        <SelectItem value="finance">المعاملات المالية</SelectItem>
                                        <SelectItem value="refunds">معالجة الاسترداد</SelectItem>
                                        <SelectItem value="executive">الملخص التنفيذي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <span className="text-sm font-medium whitespace-nowrap">الفترة:</span>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger className="w-full md:w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="week">هذا الأسبوع</SelectItem>
                                        <SelectItem value="month">هذا الشهر</SelectItem>
                                        <SelectItem value="year">هذه السنة</SelectItem>
                                        <SelectItem value="all">الكل</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="w-full md:w-auto">
                            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                            تحديث البيانات
                        </Button>
                    </div>
                </Card>

                {/* Report Template */}
                <BaseReportTemplate
                    title={getReportTitle()}
                    showPrintButton={true}
                    showExportButtons={true}
                    includeQRCode={true}
                    includeCompanyInfo={true}
                    includeReportInfo={true}
                >
                    {renderContent()}
                    {renderPagination()}
                </BaseReportTemplate>
            </div>
        </ReportProvider>
    );
};

export default AdvancedReportsPage;

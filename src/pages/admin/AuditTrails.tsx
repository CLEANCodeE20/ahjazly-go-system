import { useState, useEffect } from "react";
import {
    Activity,
    Search,
    Loader2,
    Eye,
    Filter,
    Calendar,
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

interface AuditLog {
    id: number;
    table_name: string;
    record_id: string;
    operation: string;
    old_data: any;
    new_data: any;
    changed_at: string;
    changed_by: string;
    client_info?: {
        ip?: string;
        user_agent?: string;
        origin?: string;
    };
    user_email?: string; // Fetched separately
    user_name?: string; // Fetched separately
}

const ROWS_PER_PAGE = 20;

const AuditTrails = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [tableFilter, setTableFilter] = useState("all");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, tableFilter]); // Debounce search query ideally

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' });

            if (actionFilter !== "all") {
                query = query.eq('operation', actionFilter);
            }

            if (tableFilter !== "all") {
                query = query.eq('table_name', tableFilter);
            }

            if (searchQuery) {
                // Search in record_id or potentially table_name
                // Note: searching inside JSONB (old_data/new_data) is expensive and varies by structure.
                query = query.or(`record_id.ilike.%${searchQuery}%,table_name.ilike.%${searchQuery}%`);
            }

            const from = (page - 1) * ROWS_PER_PAGE;
            const to = from + ROWS_PER_PAGE - 1;

            const { data, error, count } = await query
                .order('changed_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data) {
                // Determine unique user IDs to fetch names
                const userIds = Array.from(new Set(data.map(log => log.changed_by).filter(Boolean)));

                let userMap: Record<string, { email: string, name: string }> = {};

                if (userIds.length > 0) {
                    const { data: usersData } = await supabase
                        .from('users')
                        .select('auth_id, full_name, email')
                        .in('auth_id', userIds);

                    if (usersData) {
                        usersData.forEach(u => {
                            userMap[u.auth_id] = { name: u.full_name, email: u.email };
                        });
                    }
                }

                const enrichedLogs = data.map(log => ({
                    ...log,
                    user_name: log.changed_by ? (userMap[log.changed_by]?.name || 'Unknown User') : 'System',
                    user_email: log.changed_by ? (userMap[log.changed_by]?.email) : ''
                }));

                setLogs(enrichedLogs);
                setTotalCount(count || 0);
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatOperation = (op: string) => {
        switch (op) {
            case 'INSERT': return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">إضافة</Badge>;
            case 'UPDATE': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">تحديث</Badge>;
            case 'DELETE': return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">حذف</Badge>;
            default: return <Badge variant="outline">{op}</Badge>;
        }
    };

    const formatTableName = (name: string) => {
        const map: Record<string, string> = {
            'bookings': 'الحجوزات',
            'users': 'المستخدمين',
            'partners': 'الشركاء',
            'trips': 'الرحلات',
            'routes': 'المسارات',
            'booking_ledger': 'المعاملات المالية',
            'user_roles': 'صلاحيات المستخدمين',
        };
        return map[name] || name;
    };

    const renderDiff = (log: AuditLog) => {
        if (!log.old_data && !log.new_data) return <p className="text-muted-foreground">لا توجد بيانات</p>;

        return (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">البيانات السابقة (Old)</h4>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                        <pre className="text-xs font-mono whitespace-pre-wrap dir-ltr">
                            {log.old_data ? JSON.stringify(log.old_data, null, 2) : "N/A"}
                        </pre>
                    </ScrollArea>
                </div>
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">البيانات الجديدة (New)</h4>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                        <pre className="text-xs font-mono whitespace-pre-wrap dir-ltr">
                            {log.new_data ? JSON.stringify(log.new_data, null, 2) : "N/A"}
                        </pre>
                    </ScrollArea>
                </div>
            </div>
        );
    };

    const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);

    return (
        <AdminLayout
            title="سجل العمليات"
            subtitle="تتبع جميع التغييرات والإجراءات في النظام"
        >
            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث برقم السجل أو اسم الجدول..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-9"
                        />
                    </div>

                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
                            <SelectValue placeholder="نوع العملية" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل العمليات</SelectItem>
                            <SelectItem value="INSERT">إضافة (INSERT)</SelectItem>
                            <SelectItem value="UPDATE">تحديث (UPDATE)</SelectItem>
                            <SelectItem value="DELETE">حذف (DELETE)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={tableFilter} onValueChange={setTableFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Activity className="w-4 h-4 ml-2 text-muted-foreground" />
                            <SelectValue placeholder="الجدول" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الجداول</SelectItem>
                            <SelectItem value="bookings">الحجوزات</SelectItem>
                            <SelectItem value="trips">الرحلات</SelectItem>
                            <SelectItem value="users">المستخدمين</SelectItem>
                            <SelectItem value="partners">الشركاء</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>آخر العمليات المسجلة</span>
                            <Badge variant="secondary" className="font-normal text-xs">{totalCount} عملية</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                لا توجد سجلات مطابقة للبحث
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="py-3 px-4 text-right font-medium text-muted-foreground">الوقت</th>
                                            <th className="py-3 px-4 text-right font-medium text-muted-foreground">المستخدم</th>
                                            <th className="py-3 px-4 text-right font-medium text-muted-foreground">العملية</th>
                                            <th className="py-3 px-4 text-right font-medium text-muted-foreground">الجدول</th>
                                            <th className="py-3 px-4 text-right font-medium text-muted-foreground">رقم السجل</th>
                                            <th className="py-3 px-4 text-right font-medium text-muted-foreground">التفاصيل</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">
                                                            {format(new Date(log.changed_at), 'dd/MM/yyyy')}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(log.changed_at), 'HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{log.user_name}</span>
                                                        <span className="text-xs text-muted-foreground">{log.user_email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {formatOperation(log.operation)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="font-normal">
                                                        {formatTableName(log.table_name)}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-xs">
                                                    {log.record_id}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLog(log);
                                                            setViewDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 text-primary" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                    السابق
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    صفحة {page} من {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    التالي
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Details Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                تفاصيل العملية
                                {selectedLog && formatOperation(selectedLog.operation)}
                            </DialogTitle>
                            <DialogDescription>
                                سجل التغييرات للجدول: {selectedLog && formatTableName(selectedLog.table_name)} (ID: {selectedLog?.record_id})
                            </DialogDescription>
                        </DialogHeader>

                        {selectedLog && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground">القائم بالعملية</p>
                                        <p className="font-medium text-sm">{selectedLog.user_name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{selectedLog.user_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">التاريخ والوقت</p>
                                        <p className="font-medium text-sm text-sky-600 dir-ltr text-right">
                                            {format(new Date(selectedLog.changed_at), "yyyy-MM-dd HH:mm:ss")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">الجدول</p>
                                        <p className="font-medium text-sm">{selectedLog.table_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">رقم السجل</p>
                                        <p className="font-medium text-sm font-mono">{selectedLog.record_id}</p>
                                    </div>

                                    {/* New Client Info Section */}
                                    {selectedLog.client_info && (
                                        <div className="col-span-2 md:col-span-4 border-t pt-3 mt-1">
                                            <p className="text-xs text-muted-foreground mb-2">معلومات الاتصال (Technical Context)</p>
                                            <div className="flex flex-wrap gap-4 text-xs font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">IP:</span>
                                                    <Badge variant="outline" className="bg-background">{selectedLog.client_info.ip || 'Unknown'}</Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">User Agent:</span>
                                                    <span className="text-foreground max-w-sm truncate" title={selectedLog.client_info.user_agent}>
                                                        {selectedLog.client_info.user_agent || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {renderDiff(selectedLog)}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AuditTrails;

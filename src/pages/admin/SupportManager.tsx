import { useState, useEffect } from "react";
import {
    LifeBuoy,
    Search,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Filter,
    MessageSquare,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface SupportTicket {
    ticket_id: number;
    user_id: number;
    title: string;
    description: string;
    issue_type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    users?: {
        full_name: string;
        email: string;
    };
}

const SupportManager = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);
    const itemsPerPage = 10;

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [currentPage, statusFilter, searchQuery]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('support_tickets')
                .select('*, users(full_name, email)', { count: 'exact' });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setTickets(data as any[] || []);
            setTotalTickets(count || 0);

        } catch (error: any) {
            console.error('Error fetching tickets:', error);
            toast.error("فشل في تحميل تذاكر الدعم");
        } finally {
            setLoading(false);
        }
    };

    const updateTicketStatus = async (ticketId: number, newStatus: string) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('ticket_id', ticketId);

            if (error) throw error;

            toast.success("تم تحديث حالة التذكرة بنجاح");
            fetchTickets();
            if (selectedTicket?.ticket_id === ticketId) {
                setSelectedTicket({ ...selectedTicket, status: newStatus as any });
            }
        } catch (error: any) {
            toast.error("فشل في تحديث الحالة");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">مفتوحة</span>;
            case 'in_progress':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">قيد المعالجة</span>;
            case 'resolved':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">تم الحل</span>;
            case 'closed':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">مغلقة</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <span className="text-red-600 font-bold">عاجل جداً</span>;
            case 'high':
                return <span className="text-orange-600 font-medium">عالية</span>;
            case 'medium':
                return <span className="text-blue-600">متوسطة</span>;
            case 'low':
                return <span className="text-gray-600">منخفضة</span>;
            default:
                return priority;
        }
    };

    return (
        <AdminLayout
            title="مركز الدعم الفني"
            subtitle="إدارة استفسارات وشكاوى المستخدمين"
        >
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border flex-1">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث في التذاكر..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border-none shadow-none focus-visible:ring-0 h-8"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="تصفية حسب الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            <SelectItem value="open">مفتوحة</SelectItem>
                            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                            <SelectItem value="resolved">تم الحل</SelectItem>
                            <SelectItem value="closed">مغلقة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">التذكرة</TableHead>
                                        <TableHead className="text-right">المستخدم</TableHead>
                                        <TableHead className="text-right">الأولوية</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">التاريخ</TableHead>
                                        <TableHead className="text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                لا توجد تذاكر دعم حالياً
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tickets.map((ticket) => (
                                            <TableRow key={ticket.ticket_id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{ticket.title}</span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{ticket.issue_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">{ticket.users?.full_name || "غير معروف"}</span>
                                                            <span className="text-xs text-muted-foreground">{ticket.users?.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground" dir="ltr">
                                                    {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedTicket(ticket);
                                                                setIsDetailsOpen(true);
                                                            }}>
                                                                <MessageSquare className="w-4 h-4 ml-2" /> تفاصيل التذكرة
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateTicketStatus(ticket.ticket_id, 'in_progress')}>
                                                                <Clock className="w-4 h-4 ml-2" /> قيد المعالجة
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateTicketStatus(ticket.ticket_id, 'resolved')}>
                                                                <CheckCircle2 className="w-4 h-4 ml-2" /> تم الحل
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => updateTicketStatus(ticket.ticket_id, 'closed')}>
                                                                <AlertCircle className="w-4 h-4 ml-2" /> إغلاق
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {totalTickets > 0 && (
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(totalTickets / itemsPerPage)}
                                    totalItems={totalTickets}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Ticket Details Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>تفاصيل تذكرة الدعم #{selectedTicket?.ticket_id}</DialogTitle>
                            <DialogDescription>
                                {selectedTicket?.issue_type} - {selectedTicket && getStatusBadge(selectedTicket.status)}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <h3 className="font-bold mb-1">{selectedTicket?.title}</h3>
                                <p className="text-sm whitespace-pre-wrap">{selectedTicket?.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">المستخدم:</span>
                                    <span>{selectedTicket?.users?.full_name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">الأولوية:</span>
                                    <span>{selectedTicket && getPriorityBadge(selectedTicket.priority)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">تاريخ الإنشاء:</span>
                                    <span dir="ltr">{selectedTicket && new Date(selectedTicket.created_at).toLocaleString('ar-SA')}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">آخر تحديث:</span>
                                    <span dir="ltr">{selectedTicket && new Date(selectedTicket.created_at).toLocaleString('ar-SA')}</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Select
                                value={selectedTicket?.status}
                                onValueChange={(val) => selectedTicket && updateTicketStatus(selectedTicket.ticket_id, val)}
                                disabled={isUpdating}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="تغيير الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">فتح التذكرة</SelectItem>
                                    <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                                    <SelectItem value="resolved">تحديد كمحلولة</SelectItem>
                                    <SelectItem value="closed">إغلاق التذكرة</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={() => setIsDetailsOpen(false)}>إغلاق النافذة</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default SupportManager;

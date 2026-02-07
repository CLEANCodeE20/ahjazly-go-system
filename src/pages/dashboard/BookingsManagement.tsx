import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Eye,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Banknote,
  Users,
  Navigation,
  CreditCard,
  MapPin,
  Calendar,
  Layers,
  DollarSign,
  Info,
  ShieldCheck,
  History,
  Plus
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBookings,
  useUpdateBookingStatus,
  useCancelBooking,
  useConfirmPayment,
  useUpdatePassengerDetails,
  useCheckInPassenger,
  usePartialCancelBooking,
  useTransferBooking,
  Booking
} from "@/hooks/useBookings";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import TicketPrint from "@/components/TicketPrint";
import { useReactToPrint } from "react-to-print";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePartner } from "@/hooks/usePartner";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";

const BookingsManagement = () => {
  const { partner, partnerId } = usePartner();
  const { isAdmin } = useAuth();
  const { can } = usePermissions();
  const { wallet } = useWallet();

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEditPassengerDialog, setShowEditPassengerDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<number[]>([]);
  const [newTripId, setNewTripId] = useState<string>("");

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [selectedPassengerIndex, setSelectedPassengerIndex] = useState(0);
  const [cancelReason, setCancelReason] = useState("إلغاء بناءً على طلب العميل");
  const [refundPreview, setRefundPreview] = useState<any>(null);

  // Queries & Mutations
  const { data, isLoading, refetch } = useBookings({
    page,
    pageSize,
    searchQuery,
    statusFilter: filterStatus,
    partnerId
  });

  const { mutate: updateStatus } = useUpdateBookingStatus();
  const { mutateAsync: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: confirmPayment, isPending: isConfirmingPayment } = useConfirmPayment();
  const { mutate: updatePassenger } = useUpdatePassengerDetails();
  const { mutate: checkInPassenger } = useCheckInPassenger();
  const { mutate: partialCancel } = usePartialCancelBooking();
  const { mutate: transferBooking } = useTransferBooking();

  useRealtimeBookings(() => {
    refetch();
  });

  const { exportToExcel, exportToPDF } = useExport();
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `تذكرة-${selectedBooking?.booking_id}`,
  });

  // Action Handlers
  const handlePreviewCancel = async (booking: Booking) => {
    setSelectedBooking(booking);
    try {
      const preview = await cancelBooking({ id: booking.booking_id, reason: cancelReason, confirm: false });
      setRefundPreview(preview);
      setShowCancelDialog(true);
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      await cancelBooking({
        id: selectedBooking.booking_id,
        reason: cancelReason,
        confirm: true
      });
      setShowCancelDialog(false);
      setRefundPreview(null);
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedBooking) return;
    confirmPayment({
      id: selectedBooking.booking_id,
      method: paymentMethod,
      status: 'paid',
      txId: transactionId
    }, {
      onSuccess: () => {
        setShowPaymentDialog(false);
        setTransactionId("");
      }
    });
  };

  const handleUpdatePassenger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPassenger) return;
    updatePassenger({
      id: selectedPassenger.passenger_id,
      fullName: selectedPassenger.full_name,
      idNumber: selectedPassenger.id_number,
      gender: selectedPassenger.gender,
      birthDate: selectedPassenger.birth_date,
      phone: selectedPassenger.phone_number
    }, {
      onSuccess: () => setShowEditPassengerDialog(false)
    });
  };

  const handleToggleCheckIn = (passenger: any) => {
    checkInPassenger({
      id: passenger.passenger_id,
      isCheckedIn: passenger.passenger_status !== 'checked_in'
    });
  };

  const handleConfirmPartialCancel = () => {
    if (!selectedBooking || selectedPassengerIds.length === 0) return;
    partialCancel({
      bookingId: selectedBooking.booking_id,
      passengerIds: selectedPassengerIds
    }, {
      onSuccess: () => {
        setShowCancelDialog(false);
        setSelectedPassengerIds([]);
      }
    });
  };

  const handleConfirmTransfer = () => {
    if (!selectedBooking || !newTripId) return;
    transferBooking({
      bookingId: selectedBooking.booking_id,
      newTripId: parseInt(newTripId)
    }, {
      onSuccess: () => {
        setShowTransferDialog(false);
        setNewTripId("");
      }
    });
  };

  // UI Helpers
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="w-3 h-3" /> مؤكد</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1"><Clock className="w-3 h-3" /> انتظار</Badge>;
      case "cancelled":
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> {status === 'rejected' ? 'مرفوض' : 'ملغي'}</Badge>;
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3" /> مدفوع</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-blue-600 gap-1"><CheckCircle2 className="w-3 h-3" /> مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">مدفوع</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">غير مدفوع</Badge>;
      case "refunded":
        return <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">مسترد</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return (
    <DashboardLayout
      title="إدارة الحجوزات"
      subtitle="عرض ومتابعة جميع الحجوزات والعمليات المالية"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard/advanced-reports?type=bookings'}>
              <FileText className="w-4 h-4 ml-2 text-blue-600" />
              تقرير تفصيلي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { }}>
              <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
              Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { }}>
              <FileText className="w-4 h-4 ml-2 text-red-600" />
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/[0.03] border-primary/10 transition-all hover:bg-primary/[0.05]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">إجمالي الحجوزات</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{data?.totalCount || 0}</span>
                  <span className="text-[10px] text-muted-foreground">حجز</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/[0.03] border-amber-500/10 transition-all hover:bg-amber-500/[0.05]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider">بانتظار الموافقة</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-amber-600">{data?.bookings.filter(b => b.booking_status === 'pending').length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/[0.03] border-green-500/10 transition-all hover:bg-green-500/[0.05]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-green-600 uppercase font-black tracking-wider">مؤكدة ومدفوعة</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-green-600">{data?.bookings.filter(b => b.booking_status === 'confirmed' && b.payment_status === 'paid').length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/10 transition-all hover:bg-secondary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-secondary uppercase font-black tracking-wider">إجمالي الإيرادات</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-secondary">{data?.bookings.reduce((acc, curr) => acc + (curr.total_price || 0), 0).toLocaleString()}</span>
                  <span className="text-[10px] text-secondary font-bold">ر.س</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الحجز، اسم العميل، أو الجوال..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              {[
                { id: "all", label: "الكل" },
                { id: "pending", label: "انتظار" },
                { id: "confirmed", label: "مؤكد" },
                { id: "completed", label: "مكتمل" },
                { id: "cancelled", label: "ملغي/مرفوض" }
              ].map((s) => (
                <Button
                  key={s.id}
                  variant={filterStatus === s.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilterStatus(s.id);
                    setPage(1);
                  }}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && data?.bookings.length === 0 && (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center">
              <Ticket className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">لا يوجد حجوزات تطابق البحث</p>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {!isLoading && data && data.bookings.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="py-4 px-4 font-bold">الحجز</th>
                    <th className="py-4 px-4 font-bold">المسافر</th>
                    <th className="py-4 px-4 font-bold">المقعد</th>
                    <th className="py-4 px-4 font-bold">الرحلة</th>
                    <th className="py-4 px-4 font-bold">السعر</th>
                    <th className="py-4 px-4 font-bold">الحالة</th>
                    <th className="py-4 px-4 font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.bookings.map((booking) => (
                    <tr key={booking.booking_id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-primary font-bold">#BK-{booking.booking_id}</span>
                        <p className="text-[10px] text-muted-foreground">{new Date(booking.booking_date).toLocaleDateString('ar-SA')}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">{booking.user?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{booking.user?.phone_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {booking.passengers && booking.passengers.length > 0 ? (
                          <Badge variant="outline" className="font-mono">
                            {booking.passengers.map(p => p.seat_number || p.seat_id).join(', ')}
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-xs">
                          {booking.trip?.route?.origin_city} ➔ {booking.trip?.route?.destination_city}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {booking.trip && new Date(booking.trip.departure_time).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-secondary">{booking.total_price} ر.س</p>
                        {getPaymentBadge(booking.payment_status)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(booking.booking_status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailsDialog(true);
                          }}>
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          {/* Pending Actions: Approve / Reject */}
                          {booking.booking_status === 'pending' && can('bookings.manage') && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="موافقة وتأكيد"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => updateStatus({
                                  id: booking.booking_id,
                                  status: 'confirmed',
                                  notes: 'Approved by Employee/Partner'
                                })}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="رفض الحجز"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handlePreviewCancel(booking)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* Confirmed but Unpaid: Payment Action */}
                          {booking.booking_status === 'confirmed' && booking.payment_status === 'pending' && can('bookings.manage') && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="تحصيل المبلغ"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowPaymentDialog(true);
                              }}>
                              <Banknote className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Paid/Confirmed: Cancellation/Refund Action */}
                          {booking.booking_status === 'confirmed' && booking.payment_status === 'paid' && can('bookings.manage') && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="إلغاء واسترداد"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handlePreviewCancel(booking)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}

                          <Button size="icon" variant="ghost" title="نقل لرحلة أخرى" onClick={() => {
                            setSelectedBooking(booking);
                            setShowTransferDialog(true);
                          }}>
                            <Navigation className="w-4 h-4 text-purple-600" />
                          </Button>
                          <Button size="icon" variant="ghost" title="طباعة" onClick={() => {
                            setSelectedBooking(booking);
                            setSelectedPassengerIndex(0);
                            setShowPrintDialog(true);
                          }}>
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">صفحة {page} من {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronRight className="w-4 h-4 ml-1" /> السابق
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  التالي <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الحجز #BK-{selectedBooking?.booking_id}</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase">حالة الحجز</p>
                  {getStatusBadge(selectedBooking.booking_status)}
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase">حالة الدفع</p>
                  {getPaymentBadge(selectedBooking.payment_status)}
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase">الإجمالي</p>
                  <p className="font-bold text-secondary">{selectedBooking.total_price} ر.س</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase">طريقة الدفع</p>
                  <p className="font-bold flex items-center gap-1"><CreditCard className="w-3 h-3" /> {selectedBooking.payment_method || 'نقداً'}</p>
                </div>
              </div>

              <Tabs defaultValue="passengers" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="passengers" className="text-xs">الركاب ({selectedBooking.passengers?.length})</TabsTrigger>
                  <TabsTrigger value="trip" className="text-xs">تفاصيل الرحلة</TabsTrigger>
                  <TabsTrigger value="financial" className="text-xs">السجل المالي</TabsTrigger>
                </TabsList>

                <TabsContent value="passengers" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBooking.passengers?.map((p, i) => (
                      <div key={i} className={`p-4 rounded-2xl border border-border/50 hover:border-primary/30 transition-all relative overflow-hidden group ${p.passenger_status === 'cancelled' ? 'bg-red-50 opacity-60' : p.passenger_status === 'checked_in' ? 'bg-green-50' : 'bg-muted/20'}`}>
                        {p.passenger_status === 'checked_in' && (
                          <div className="absolute -left-6 -top-6 w-12 h-12 bg-green-500/20 rotate-45 flex items-center justify-center pt-6 pl-6 text-green-600">
                            <ShieldCheck className="w-3 h-3 -rotate-45" />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-3">
                            {p.id_image && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-white flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(p.id_image, '_blank')}>
                                <img src={p.id_image} alt="ID" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-black block">{p.full_name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : 'غير محدد'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="font-mono bg-primary/10 text-primary border-primary/20 shadow-sm">مقعد: {p.seat_number || p.seat_id}</Badge>
                            {p.passenger_status === 'cancelled' ? (
                              <Badge variant="destructive" className="text-[8px]">ملغي</Badge>
                            ) : (
                              <div className="flex gap-1 mt-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                  setSelectedPassenger(p);
                                  setShowEditPassengerDialog(true);
                                }}>
                                  <History className="w-3 h-3 text-blue-600" />
                                </Button>
                                <Button size="icon" variant={p.passenger_status === 'checked_in' ? "default" : "outline"} className={`h-6 w-6 ${p.passenger_status === 'checked_in' ? "bg-green-600" : ""}`} onClick={() => handleToggleCheckIn(p)}>
                                  <CheckCircle2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                          <div className="space-y-0.5">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">رقم الهوية</p>
                            <p className="text-[10px] font-mono flex items-center gap-1">
                              <FileText className="w-3 h-3 text-primary/60" /> {p.id_number || '---'}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">تاريخ الميلاد</p>
                            <p className="text-[10px] font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-secondary/60" /> {p.birth_date || '---'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-xl flex items-center gap-3">
                    <Info className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="text-sm font-bold">معلومات العميل الأساسي</p>
                      <p className="text-xs text-muted-foreground">{selectedBooking.user?.full_name} - {selectedBooking.user?.phone_number}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trip">
                  <div className="p-4 border rounded-xl bg-primary/[0.02] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">الانطلاق</p>
                        <p className="font-bold">{selectedBooking.trip?.route?.origin_city}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4">
                        <div className="w-full h-px bg-border relative">
                          <MapPin className="w-3 h-3 absolute -top-1.5 -left-1.5 text-primary" />
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
                          <MapPin className="w-3 h-3 absolute -top-1.5 -right-1.5 text-secondary" />
                        </div>
                        <span className="text-[10px] mt-2 font-mono">TRIP-{selectedBooking.trip_id}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">الوصول</p>
                        <p className="font-bold">{selectedBooking.trip?.route?.destination_city}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/50 border rounded-lg">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> التاريخ والوقت</p>
                        <p className="text-xs font-bold mt-1 text-primary">{selectedBooking.trip && new Date(selectedBooking.trip.departure_time).toLocaleString('ar-SA')}</p>
                      </div>
                      <div className="p-3 bg-white/50 border rounded-lg">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> الحافلة والناقل</p>
                        <p className="text-xs font-bold mt-1 text-secondary">{partner?.company_name}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="p-5 border rounded-2xl bg-secondary/[0.03] border-secondary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-secondary/20" />
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> ملخص الحساب</span>
                      <span className="text-2xl font-black text-secondary">{selectedBooking.total_price} ر.س</span>
                    </div>

                    {isAdmin() && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-white rounded-xl border border-amber-200">
                          <p className="text-[10px] text-amber-600 font-black uppercase mb-1">عمولة المنصة</p>
                          <p className="text-sm font-bold text-amber-700">+{selectedBooking.platform_commission || 0} ر.س</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-primary/20">
                          <p className="text-[10px] text-primary font-black uppercase mb-1">صافي إيراد الشريك</p>
                          <p className="text-sm font-bold text-primary">{selectedBooking.partner_revenue || 0} ر.س</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 p-3 bg-white/50 rounded-xl border border-border/30">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">رقم المرجع:</span>
                        <span className="font-mono font-bold">{selectedBooking.gateway_transaction_id || '---'}</span>
                      </div>
                      {selectedBooking.payment_timestamp && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">وقت السداد:</span>
                          <span className="font-bold">{new Date(selectedBooking.payment_timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBooking.ledger && selectedBooking.ledger.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4" /> سجل المعاملات المالية الموثقة
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedBooking.ledger.map((entry, idx) => (
                          <div key={idx} className="group p-3 bg-white border border-border/60 rounded-xl hover:border-secondary/30 transition-all flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.entry_type === 'payment' || entry.entry_type === 'booking' ? 'bg-green-100 text-green-600' :
                                entry.entry_type === 'refund' ? 'bg-red-100 text-red-600' :
                                  entry.entry_type === 'commission' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
                                }`}>
                                {entry.entry_type === 'payment' ? <CheckCircle2 className="w-4 h-4" /> :
                                  entry.entry_type === 'booking' ? <Ticket className="w-4 h-4" /> :
                                    entry.entry_type === 'refund' ? <History className="w-4 h-4" /> :
                                      entry.entry_type === 'commission' ? <DollarSign className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-black">{
                                  entry.entry_type === 'payment' ? 'تحصيل مبلغ' :
                                    entry.entry_type === 'booking' ? 'إنشاء حجز' :
                                      entry.entry_type === 'refund' ? 'استرداد مبلغ' :
                                        entry.entry_type === 'commission' ? 'عمولة منصة' :
                                          entry.entry_type === 'adjustment' ? 'تسوية مالية' : entry.entry_type
                                }</span>
                                <p className="text-[10px] text-muted-foreground leading-tight">{entry.note || '-'}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <span className={`text-xs font-black block ${entry.amount > 0 ? 'text-green-600' : 'text-red-700'}`}>
                                {entry.amount > 0 ? '+' : ''}{entry.amount} ر.س
                              </span>
                              <span className="text-[8px] text-muted-foreground">{new Date(entry.created_at).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-4 border-t border-border/50">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>إغلاق</Button>
                <Button variant="secondary" onClick={() => {
                  setShowDetailsDialog(false);
                  setSelectedPassengerIndex(0);
                  setShowPrintDialog(true);
                }}>
                  <Printer className="w-4 h-4 ml-2" /> طباعة التذكرة
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation & Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحصيل مبلغ الحجز</DialogTitle>
            <DialogDescription>تأكيد استلام المبلغ وتغيير حالة الحجز إلى "مدفوع"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg flex justify-between items-center">
              <span>المبلغ المستحق:</span>
              <span className="text-xl font-black text-secondary">{selectedBooking?.total_price} ر.س</span>
            </div>

            <div className="space-y-2">
              <Label>طريقة التحصيل</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="kareemi">الكريمي (أصيل)</SelectItem>
                  <SelectItem value="wallet">محفظة إلكترونية (رصيد المكتب)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'wallet' && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex justify-between items-center">
                <span className="text-xs">رصيد المحفظة الحالي:</span>
                <span className="font-bold text-primary">
                  {wallet?.balance?.toLocaleString() || '0'} {wallet?.currency || 'ر.س'}
                </span>
              </div>
            )}

            {paymentMethod !== 'cash' && paymentMethod !== 'wallet' && (
              <div className="space-y-2">
                <Label>رقم الإيصال / المرجع</Label>
                <Input
                  placeholder="أدخل رقم العملية..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>إلغاء</Button>
            <Button onClick={handleConfirmPayment} disabled={isConfirmingPayment}>
              {isConfirmingPayment ? 'جاري التأكيد...' : 'تأكيد استلام المبلغ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 font-black">
              <AlertCircle className="w-6 h-6" /> إلغاء الحجز والاسترداد
            </DialogTitle>
          </DialogHeader>
          {refundPreview && (
            <div className="space-y-4 py-4">
              {/* Partial Selection */}
              <div className="space-y-2">
                <Label className="text-xs">اختر الركاب المراد إلغاء حجوزاتهم (إلغاء جزئي):</Label>
                <div className="grid grid-cols-1 gap-2 border p-3 rounded-lg bg-muted/20">
                  {selectedBooking?.passengers?.filter(p => p.passenger_status !== 'cancelled').map((p) => (
                    <div key={p.passenger_id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPassengerIds.includes(p.passenger_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPassengerIds([...selectedPassengerIds, p.passenger_id]);
                          } else {
                            setSelectedPassengerIds(selectedPassengerIds.filter(id => id !== p.passenger_id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{p.full_name} (مقعد {p.seat_number || p.seat_id})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span>إجمالي المبلغ الأصلي:</span>
                  <span className="font-bold">{refundPreview.total_price} ر.س</span>
                </div>
                <div className="flex justify-between text-sm text-destructive">
                  <span>رسوم الإلغاء المتوقعة:</span>
                  <span className="font-bold">-{refundPreview.cancellation_fee} ر.س</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-black text-green-700">
                  <span>المبلغ التقريبي المسترد:</span>
                  <span>{selectedPassengerIds.length > 0 ? (refundPreview.refund_amount / (selectedBooking?.passengers?.length || 1) * selectedPassengerIds.length).toFixed(2) : refundPreview.refund_amount} ر.س</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>سبب الإلغاء</Label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCancelDialog(false);
              setSelectedPassengerIds([]);
            }}>تراجع</Button>
            {selectedPassengerIds.length > 0 ? (
              <Button variant="destructive" onClick={handleConfirmPartialCancel} disabled={isCancelling}>
                {isCancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء الجزئي'}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleConfirmCancel} disabled={isCancelling}>
                {isCancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء النهائي (للكل)'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>طباعة التذكرة</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <>
              {selectedBooking.passengers && selectedBooking.passengers.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide" dir="rtl">
                  {selectedBooking.passengers.map((p, idx) => (
                    <Button
                      key={idx}
                      variant={selectedPassengerIndex === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPassengerIndex(idx)}
                      className="whitespace-nowrap"
                    >
                      {p.full_name.split(' ')[0]} (مقعد {p.seat_number || p.seat_id})
                    </Button>
                  ))}
                </div>
              )}

              <TicketPrint
                ref={ticketRef}
                booking={{
                  booking_id: selectedBooking.booking_id,
                  total_price: selectedBooking.total_price,
                  booking_date: selectedBooking.booking_date,
                  payment_method: selectedBooking.payment_method || "cash",
                  payment_status: selectedBooking.payment_status
                }}
                passenger={selectedBooking.passengers && selectedBooking.passengers[selectedPassengerIndex] ? {
                  full_name: selectedBooking.passengers[selectedPassengerIndex].full_name,
                  phone_number: selectedBooking.user?.phone_number || '',
                  id_number: selectedBooking.passengers[selectedPassengerIndex].id_number,
                  seat_number: (selectedBooking.passengers[selectedPassengerIndex].seat_number || selectedBooking.passengers[selectedPassengerIndex].seat_id)?.toString(),
                  gender: selectedBooking.passengers[selectedPassengerIndex].gender
                } : {
                  full_name: selectedBooking.user?.full_name || 'زائر',
                  phone_number: selectedBooking.user?.phone_number || '',
                  id_number: '',
                  seat_number: 'A1',
                  gender: 'male'
                }}
                companyName={partner?.company_name}
                logoUrl={undefined}
                trip={{
                  origin: selectedBooking.trip?.route?.origin_city || 'غير محدد',
                  destination: selectedBooking.trip?.route?.destination_city || 'غير محدد',
                  date: selectedBooking.trip ? new Date(selectedBooking.trip.departure_time).toLocaleDateString('ar-SA') : '',
                  time: selectedBooking.trip ? new Date(selectedBooking.trip.departure_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" onClick={() => handlePrint()}>
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </Button>
                <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                  إغلاق
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Passenger Dialog */}
      <Dialog open={showEditPassengerDialog} onOpenChange={setShowEditPassengerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المسافر</DialogTitle>
          </DialogHeader>
          {selectedPassenger && (
            <form onSubmit={handleUpdatePassenger} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={selectedPassenger.full_name}
                  onChange={(e) => setSelectedPassenger({ ...selectedPassenger, full_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهوية</Label>
                  <Input
                    value={selectedPassenger.id_number || ''}
                    onChange={(e) => setSelectedPassenger({ ...selectedPassenger, id_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select
                    value={selectedPassenger.gender}
                    onValueChange={(v) => setSelectedPassenger({ ...selectedPassenger, gender: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={selectedPassenger.birth_date || ''}
                  onChange={(e) => setSelectedPassenger({ ...selectedPassenger, birth_date: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditPassengerDialog(false)}>إلغاء</Button>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Booking Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نقل الحجز لرحلة أخرى</DialogTitle>
            <DialogDescription>سيتم نقل جميع الركاب المتبقين إلى رحلة بديلة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>رقم الرحلة الجديدة (Trip ID)</Label>
              <Input
                placeholder="أدخل رقم الرحلة البديلة..."
                value={newTripId}
                onChange={(e) => setNewTripId(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                * ملاحظة: يجب أن تكون الرحلة البديلة تابعة لنفس الشركة وبها سعة كافية.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>تراجع</Button>
            <Button onClick={handleConfirmTransfer} disabled={!newTripId}>تأكيد النقل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};

export default BookingsManagement;

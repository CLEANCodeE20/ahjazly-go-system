import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Loader2,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    FileText,
    TrendingUp,
    UserCheck,
    UserX,
    Users,
} from "lucide-react";
import { useDrivers, useDeleteDriver, Driver } from "@/hooks/useDrivers";
import { DriverFormDialog } from "@/components/driver/DriverFormDialog";
import { DriverPerformanceDialog } from "@/components/driver/DriverPerformanceDialog";
import { DriverDocumentsDialog } from "@/components/driver/DriverDocumentsDialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";

const DriversManagement = () => {
    const { data: drivers, isLoading } = useDrivers();
    const deleteDriver = useDeleteDriver();
    const { can } = usePermissions();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [performanceDriverId, setPerformanceDriverId] = useState<number | null>(null);
    const [documentsDriverId, setDocumentsDriverId] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // تصفية السائقين
    const filteredDrivers = drivers?.filter((driver) => {
        const matchesSearch =
            driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.phone_number?.includes(searchTerm) ||
            driver.license_number?.includes(searchTerm);

        const matchesStatus =
            statusFilter === "all" || driver.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleDelete = async (driverId: number) => {
        await deleteDriver.mutateAsync(driverId);
        setDeleteConfirmId(null);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            active: { variant: "default", label: "نشط" },
            on_leave: { variant: "secondary", label: "في إجازة" },
            suspended: { variant: "destructive", label: "موقوف" },
            terminated: { variant: "outline", label: "منتهي الخدمة" },
        };

        const config = variants[status] || variants.active;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout
            title="إدارة السائقين"
            subtitle="إدارة بيانات السائقين، الوثائق، ومتابعة الأداء الميداني"
            actions={
                can('fleet.create') && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary shadow-lg border-0 group">
                        <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform" />
                        إضافة سائق جديد
                    </Button>
                )
            }
        >
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Stats Cards with Premium Gradients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="overflow-hidden border-0 shadow-elegant hover:shadow-xl transition-all group">
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">إجمالي السائقين</CardTitle>
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight">{drivers?.length || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">كافة الأنواع</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-elegant hover:shadow-xl transition-all group">
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-green-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">السائقون النشطون</CardTitle>
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight text-green-600">
                                {drivers?.filter((d) => d.status === "active").length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-green-600/60">جاهزون للعمل</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-elegant hover:shadow-xl transition-all group">
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">في إجازة</CardTitle>
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                                <UserX className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight text-amber-600">
                                {drivers?.filter((d) => d.status === "on_leave").length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-amber-600/60">خارج العمل مؤقتاً</p>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-elegant hover:shadow-xl transition-all group">
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-destructive/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-medium">موقوفون</CardTitle>
                            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                <UserX className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold tracking-tight text-destructive">
                                {drivers?.filter((d) => d.status === "suspended").length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 text-destructive/60">بانتظار المراجعة</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters with Glassmorphism Effect */}
                <Card className="border-0 shadow-elegant bg-card/60 backdrop-blur-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="البحث بالاسم، الهاتف، أو رقم الرخصة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10 bg-white/50 border-border/50 focus:border-primary/30 transition-all"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[200px] bg-white/50 border-border/50">
                                    <SelectValue placeholder="الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الحالات</SelectItem>
                                    <SelectItem value="active">نشط</SelectItem>
                                    <SelectItem value="on_leave">في إجازة</SelectItem>
                                    <SelectItem value="suspended">موقوف</SelectItem>
                                    <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Drivers Content - Table for Desktop, Cards for Mobile */}
                <Card className="border-0 shadow-elegant overflow-hidden">
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-bold">السائق</TableHead>
                                        <TableHead>رقم الهاتف</TableHead>
                                        <TableHead>بيانات الرخصة</TableHead>
                                        <TableHead>نوع التوظيف</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead className="text-left py-4 px-6">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDrivers?.map((driver) => (
                                        <TableRow key={driver.driver_id} className="hover:bg-primary/5 transition-colors group">
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                                                        {driver.full_name[0]}
                                                    </div>
                                                    <span className="font-semibold text-foreground">{driver.full_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{driver.phone_number || "-"}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{driver.license_number || "-"}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {driver.license_expiry
                                                            ? `تنتهي: ${new Date(driver.license_expiry).toLocaleDateString("ar-SA")}`
                                                            : "لا يوجد تاريخ"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-muted/20 font-normal">
                                                    {driver.employment_type === "full_time"
                                                        ? "دوام كامل"
                                                        : driver.employment_type === "part_time"
                                                            ? "دوام جزئي"
                                                            : "متعاقد"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(driver.status)}</TableCell>
                                            <TableCell className="px-6">
                                                <div className="flex items-center justify-start gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => setSelectedDriver(driver)}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>تعديل البيانات</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="hover:text-secondary hover:bg-secondary/10 transition-colors" onClick={() => setPerformanceDriverId(driver.driver_id)}>
                                                                    <TrendingUp className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>تقرير الأداء</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => setDocumentsDriverId(driver.driver_id)}>
                                                                    <FileText className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>المستندات</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setDeleteConfirmId(driver.driver_id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>حذف</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-border">
                            {filteredDrivers?.map((driver) => (
                                <div key={driver.driver_id} className="p-4 bg-card active:bg-muted/20 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
                                                {driver.full_name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{driver.full_name}</h3>
                                                <p className="text-sm text-muted-foreground">{driver.phone_number || "-"}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(driver.status)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-muted/30 p-3 rounded-lg">
                                        <div>
                                            <p className="text-muted-foreground mb-1 text-xs">رقم الرخصة</p>
                                            <p className="font-medium">{driver.license_number || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1 text-xs">التوظيف</p>
                                            <p className="font-medium text-primary">
                                                {driver.employment_type === "full_time" ? "دوام كامل" : "دوام جزئي"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => setSelectedDriver(driver)}>
                                            <Edit className="w-4 h-4" /> تعديل
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 gap-2 border-secondary/50 text-secondary hover:bg-secondary/5" onClick={() => setPerformanceDriverId(driver.driver_id)}>
                                            <TrendingUp className="w-4 h-4" /> أداء
                                        </Button>
                                        <Button variant="secondary" size="icon" className="shrink-0" onClick={() => setDocumentsDriverId(driver.driver_id)}>
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => setDeleteConfirmId(driver.driver_id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredDrivers?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-lg">لا توجد نتائج مطابقة لخدمتك</p>
                                <Button variant="link" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>إعادة ضبط البحث</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialogs remain unchanged as they follow their own modal patterns */}
                <DriverFormDialog
                    open={isAddDialogOpen || !!selectedDriver}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddDialogOpen(false);
                            setSelectedDriver(null);
                        }
                    }}
                    driver={selectedDriver}
                />

                <DriverPerformanceDialog
                    driverId={performanceDriverId}
                    open={!!performanceDriverId}
                    onOpenChange={(open) => !open && setPerformanceDriverId(null)}
                />

                <DriverDocumentsDialog
                    driverId={documentsDriverId}
                    open={!!documentsDriverId}
                    onOpenChange={(open) => !open && setDocumentsDriverId(null)}
                />

                {/* Delete Confirmation */}
                <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>تأكيد الحذف</DialogTitle>
                            <DialogDescription>
                                هل أنت متأكد من حذف هذا السائق؟ هذا الإجراء سيؤدي لإيقاف كافة العمليات المرتبطة به ولا يمكن التراجع عنه.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                                تراجع
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                                disabled={deleteDriver.isPending}
                                className="shadow-lg shadow-destructive/20"
                            >
                                {deleteDriver.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                تأكيد الحذف النهائي
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default DriversManagement;

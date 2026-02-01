import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateDriver, useUpdateDriver, Driver } from "@/hooks/useDrivers";
import { useAuth } from "@/hooks/useAuth";

interface DriverFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver?: Driver | null;
}

export const DriverFormDialog = ({ open, onOpenChange, driver }: DriverFormDialogProps) => {
    const { userRole } = useAuth();
    const createDriver = useCreateDriver();
    const updateDriver = useUpdateDriver();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone_number: "",
        license_number: "",
        license_expiry: "",
        employment_type: "full_time",
        hire_date: new Date().toISOString().split("T")[0],
        emergency_contact_name: "",
        emergency_contact_phone: "",
        blood_type: "",
        notes: "",
        password: "", // Added password field
        license_file: null as File | null, // Added license_file
    });

    useEffect(() => {
        if (driver) {
            setFormData({
                full_name: driver.full_name || "",
                email: "", // لا يمكن تعديل البريد
                phone_number: driver.phone_number || "",
                license_number: driver.license_number || "",
                license_expiry: driver.license_expiry || "",
                employment_type: driver.employment_type || "full_time",
                hire_date: driver.hire_date || "",
                emergency_contact_name: driver.emergency_contact_name || "",
                emergency_contact_phone: driver.emergency_contact_phone || "",
                blood_type: driver.blood_type || "",
                notes: driver.notes || "",
                password: "", // Password not needed for edit
                license_file: null, // Reset file on edit
            });
        } else {
            // Reset form
            setFormData({
                full_name: "",
                email: "",
                phone_number: "",
                license_number: "",
                license_expiry: "",
                employment_type: "full_time",
                hire_date: new Date().toISOString().split("T")[0],
                emergency_contact_name: "",
                emergency_contact_phone: "",
                blood_type: "",
                notes: "",
                password: "",
                license_file: null, // Reset file on reset
            });
        }
    }, [driver, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (driver) {
            // تحديث سائق موجود
            await updateDriver.mutateAsync({
                driverId: driver.driver_id,
                updates: {
                    full_name: formData.full_name,
                    phone_number: formData.phone_number,
                    license_number: formData.license_number,
                    license_expiry: formData.license_expiry,
                    employment_type: formData.employment_type,
                    hire_date: formData.hire_date,
                    emergency_contact_name: formData.emergency_contact_name,
                    emergency_contact_phone: formData.emergency_contact_phone,
                    blood_type: formData.blood_type,
                    notes: formData.notes,
                },
            });
        } else {
            // إنشاء سائق جديد
            await createDriver.mutateAsync({
                ...formData,
                licenseFile: formData.license_file || undefined,
                partner_id: userRole?.partner_id || undefined,
            });
        }

        onOpenChange(false);
    };

    const isLoading = createDriver.isPending || updateDriver.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {driver ? "تعديل بيانات السائق" : "إضافة سائق جديد"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* المعلومات الأساسية */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">المعلومات الأساسية</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">الاسم الكامل *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            {!driver && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">كلمة المرور *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="phone_number">رقم الهاتف *</Label>
                                <Input
                                    id="phone_number"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* معلومات الرخصة */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">معلومات الرخصة</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="license_number">رقم الرخصة *</Label>
                                <Input
                                    id="license_number"
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="license_expiry">تاريخ انتهاء الرخصة *</Label>
                                <Input
                                    id="license_expiry"
                                    type="date"
                                    value={formData.license_expiry}
                                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {!driver && (
                            <div className="space-y-2">
                                <Label htmlFor="license_file">صورة الرخصة (اختياري)</Label>
                                <Input
                                    id="license_file"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setFormData({ ...formData, license_file: e.target.files?.[0] || null })}
                                    className="cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 hover:file:bg-primary/20 transition-all"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    يُفضل رفع نسخة واضحة من الرخصة بتنسيق PDF أو صورة.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* معلومات التوظيف */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">معلومات التوظيف</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employment_type">نوع التوظيف</Label>
                                <Select
                                    value={formData.employment_type}
                                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_time">دوام كامل</SelectItem>
                                        <SelectItem value="part_time">دوام جزئي</SelectItem>
                                        <SelectItem value="contractor">متعاقد</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="hire_date">تاريخ التعيين</Label>
                                <Input
                                    id="hire_date"
                                    type="date"
                                    value={formData.hire_date}
                                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* معلومات الطوارئ */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground">معلومات الطوارئ</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_name">اسم جهة الاتصال</Label>
                                <Input
                                    id="emergency_contact_name"
                                    value={formData.emergency_contact_name}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_phone">رقم جهة الاتصال</Label>
                                <Input
                                    id="emergency_contact_phone"
                                    value={formData.emergency_contact_phone}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blood_type">فصيلة الدم</Label>
                                <Select
                                    value={formData.blood_type}
                                    onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر فصيلة الدم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="AB+">AB+</SelectItem>
                                        <SelectItem value="AB-">AB-</SelectItem>
                                        <SelectItem value="O+">O+</SelectItem>
                                        <SelectItem value="O-">O-</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* ملاحظات */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                            {driver ? "تحديث" : "إضافة"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
};

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useDisruption, DisruptionAction } from "@/hooks/useDisruption";
import { AlertCircle, AlertTriangle, Clock, MapPin, Users, Ban } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface DisruptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: any;
    onSuccess: () => void;
}

const DisruptionModal: React.FC<DisruptionModalProps> = ({
    isOpen,
    onClose,
    trip,
    onSuccess,
}) => {
    const { handleDisruption, findAlternatives, loading } = useDisruption();
    const [action, setAction] = useState<DisruptionAction>("delay");
    const [reason, setReason] = useState("");
    const [delayMinutes, setDelayMinutes] = useState<number>(30);
    const [transferTripId, setTransferTripId] = useState<string>("");
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (isOpen && trip) {
            setReason("");
            setAction("delay");
            setAlternatives([]);
            setTransferTripId("");
        }
    }, [isOpen, trip]);

    useEffect(() => {
        if (action === "transfer" && trip) {
            loadAlternatives();
        }
    }, [action]);

    const loadAlternatives = async () => {
        setSearching(true);
        const data = await findAlternatives(trip.trip_id);
        setAlternatives(data as any[]);
        setSearching(false);
    };

    const onConfirm = async () => {
        const success = await handleDisruption({
            tripId: trip.trip_id,
            actionType: action,
            reason,
            delayMinutes: action === "delay" ? delayMinutes : undefined,
            transferTripId: action === "transfer" ? Number(transferTripId) : undefined,
        });

        if (success) {
            onSuccess();
            onClose();
        }
    };

    if (!trip) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500 h-5 w-5" />
                        إدارة اضطراب الرحلة #{trip.trip_id}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>نوع التشويش / الإجراء</Label>
                        <Select value={action} onValueChange={(v: any) => setAction(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الإجراء" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="delay">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> تسجيل تأخير
                                    </div>
                                </SelectItem>
                                <SelectItem value="transfer">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" /> نقل الركاب لرحلة أخرى
                                    </div>
                                </SelectItem>
                                <SelectItem value="divert">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> تغيير المسار
                                    </div>
                                </SelectItem>
                                <SelectItem value="cancel">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <Ban className="h-4 w-4" /> إلغاء الرحلة بالكامل
                                    </div>
                                </SelectItem>
                                <SelectItem value="emergency">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <AlertCircle className="h-4 w-4" /> حالة طارئة (SOS)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {action === "delay" && (
                        <div className="space-y-2">
                            <Label>مدة التأخير (بالدقائق)</Label>
                            <Input
                                type="number"
                                value={delayMinutes}
                                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                                min={1}
                            />
                        </div>
                    )}

                    {action === "transfer" && (
                        <div className="space-y-2">
                            <Label>الرحلة البديلة المتاحة</Label>
                            {searching ? (
                                <div className="text-sm text-muted-foreground">جاري البحث عن رحلات بديلة...</div>
                            ) : alternatives.length > 0 ? (
                                <Select value={transferTripId} onValueChange={setTransferTripId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر رحلة بديلة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {alternatives.map((alt) => (
                                            <SelectItem key={alt.trip_id} value={alt.trip_id.toString()}>
                                                {format(new Date(alt.departure_time), "p - dd MMM", { locale: ar })} (
                                                {alt.available_seats} مقاعد) | {alt.price_difference > 0 ? `+${alt.price_difference}` : alt.price_difference} ريال
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>لا توجد رحلات بديلة متاحة حالياً لنفس المسار.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>السبب / ملاحظات</Label>
                        <Textarea
                            placeholder="اكتب سبب الاضطراب هنا ليتم إبلاغ الركاب به..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>تنبيه</AlertTitle>
                        <AlertDescription>
                            سيتم إرسال إشعارات فورية (إيميل وتنبيه تطبيق) لجميع الركاب المسجلين في هذه الرحلة بمجرد التأكيد.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        إلغاء
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading || (action === "transfer" && !transferTripId)}
                        variant={action === "cancel" || action === "emergency" ? "destructive" : "default"}
                    >
                        {loading ? "جاري المعالجة..." : "تأكيد الإجراء"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DisruptionModal;

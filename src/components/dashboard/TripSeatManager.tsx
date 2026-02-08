import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TripSeatManagerProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: number;
    busId: number | null;
    routeInfo: string;
}

interface SeatLayout {
    rows: number;
    cols: number;
    cells: any[];
}

export default function TripSeatManager({ isOpen, onClose, tripId, busId, routeInfo }: TripSeatManagerProps) {
    const [loading, setLoading] = useState(true);
    const [layout, setLayout] = useState<SeatLayout | null>(null);
    const [blockedSeats, setBlockedSeats] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [busCapacity, setBusCapacity] = useState<number>(44);
    const [featureNotAvailable, setFeatureNotAvailable] = useState(false);

    useEffect(() => {
        if (isOpen && tripId && busId) {
            fetchData();
        }
    }, [isOpen, tripId, busId]);

    const fetchData = async () => {
        setLoading(true);
        setFeatureNotAvailable(false);
        try {
            // Fetch Bus Capacity and Trip Blocked Seats
            const [busRes, tripRes] = await Promise.all([
                supabase
                    .from('buses')
                    .select('capacity')
                    .eq('bus_id', busId)
                    .single(),
                supabase
                    .from('trips')
                    .select('blocked_seats')
                    .eq('trip_id', tripId)
                    .single()
            ]);

            if (busRes.error) throw busRes.error;

            const capacity = busRes.data?.capacity || 44;
            setBusCapacity(capacity);
            setBlockedSeats(tripRes.data?.blocked_seats || []);

            // Generate a default layout based on capacity
            const defaultLayout = generateDefaultLayout(capacity);
            setLayout(defaultLayout);

            // Fetch Currently Booked Seats AND Sync Missing Seats if needed
            const { count: existingSeatsCount, error: countError } = await supabase
                .from('seats')
                .select('*', { count: 'exact', head: true })
                .eq('bus_id', busId);

            if (!countError && (existingSeatsCount || 0) < capacity) {
                // Auto-generate missing seats
                const seatsToInsert = [];
                for (let i = (existingSeatsCount || 0) + 1; i <= capacity; i++) {
                    seatsToInsert.push({
                        bus_id: busId,
                        seat_number: i.toString(),
                        price_adjustment_factor: 1.0
                    });
                }

                if (seatsToInsert.length > 0) {
                    await supabase.from('seats').insert(seatsToInsert);
                    toast({
                        title: "مزامنة المقاعد",
                        description: `تم إضافة ${seatsToInsert.length} مقعد مفقود للحافلة تلقائياً.`,
                    });
                }
            }

            // Fetch Currently Booked Seats
            const { data: bookedData, error: bookedError } = await supabase
                .from('passengers')
                .select('seat_id, seats(seat_number)')
                .eq('trip_id', tripId)
                .eq('passenger_status', 'active');

            if (bookedError) throw bookedError;

            const bookedList = bookedData?.map((p: any) => p.seats?.seat_number).filter(Boolean) || [];
            setBookedSeats(bookedList);

        } catch (error: any) {
            toast({
                title: "خطأ",
                description: "فشل تحميل بيانات المقاعد: " + error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const generateDefaultLayout = (capacity: number): SeatLayout => {
        const seatsPerRow = 4;
        const rows = Math.ceil(capacity / seatsPerRow);
        return {
            rows: rows,
            cols: 5,
            cells: []
        };
    };

    const toggleSeatBlock = (seatLabel: string) => {
        if (bookedSeats.includes(seatLabel)) return;

        setBlockedSeats(prev => {
            if (prev.includes(seatLabel)) {
                return prev.filter(s => s !== seatLabel);
            } else {
                return [...prev, seatLabel];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('trips')
                .update({ blocked_seats: blockedSeats } as any)
                .eq('trip_id', tripId);

            if (error) throw error;

            toast({
                title: "تم الحفظ",
                description: "تم تحديث المقاعد المحظورة بنجاح",
            });
            onClose();
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: "فشل حفظ التغييرات: " + error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const renderGrid = () => {
        if (!layout) return null;

        const rows = layout.rows || 10;

        return (
            <div className="flex flex-col gap-2 items-center">
                {featureNotAvailable && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <span>حفظ التغييرات غير متاح حالياً - عرض توضيحي فقط</span>
                    </div>
                )}
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4">
                        <div className="flex gap-2">
                            {['A', 'B'].map(col => {
                                const label = `${rowIndex + 1}${col}`;
                                const isBlocked = blockedSeats.includes(label);
                                const isBooked = bookedSeats.includes(label);
                                return (
                                    <div
                                        key={label}
                                        onClick={() => !isBooked && toggleSeatBlock(label)}
                                        className={cn(
                                            "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold border cursor-pointer transition-colors relative",
                                            isBooked ? "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed" :
                                                isBlocked ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" :
                                                    "bg-background text-foreground border-border hover:bg-muted"
                                        )}
                                    >
                                        {label}
                                        {isBlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-md">
                                                <Ban className="w-6 h-6 text-red-500 opacity-50" />
                                            </div>
                                        )}
                                        {isBooked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-md">
                                                <CheckCircle className="w-6 h-6 text-blue-500 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="w-6" />
                        <div className="flex gap-2">
                            {['C', 'D'].map(col => {
                                const label = `${rowIndex + 1}${col}`;
                                const isBlocked = blockedSeats.includes(label);
                                const isBooked = bookedSeats.includes(label);
                                return (
                                    <div
                                        key={label}
                                        onClick={() => !isBooked && toggleSeatBlock(label)}
                                        className={cn(
                                            "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold border cursor-pointer transition-colors relative",
                                            isBooked ? "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed" :
                                                isBlocked ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" :
                                                    "bg-background text-foreground border-border hover:bg-muted"
                                        )}
                                    >
                                        {label}
                                        {isBlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-md">
                                                <Ban className="w-6 h-6 text-red-500 opacity-50" />
                                            </div>
                                        )}
                                        {isBooked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-md">
                                                <CheckCircle className="w-6 h-6 text-blue-500 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>إدارة مقاعد الرحلة #{tripId}</DialogTitle>
                    <DialogDescription>
                        {routeInfo} - سعة الحافلة: {busCapacity} مقعد
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-background border border-border rounded" />
                                    <span className="text-sm">متاح</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                                        <Ban className="w-3 h-3 text-red-500" />
                                    </div>
                                    <span className="text-sm">محظور (مغلق)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                                        <CheckCircle className="w-3 h-3 text-blue-500" />
                                    </div>
                                    <span className="text-sm">محجوز (راكب)</span>
                                </div>
                            </div>

                            {renderGrid()}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>إغلاق</Button>
                    <Button onClick={handleSave} disabled={saving || loading} className="bg-primary hover:bg-primary/90">
                        {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                        حفظ التغييرات
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

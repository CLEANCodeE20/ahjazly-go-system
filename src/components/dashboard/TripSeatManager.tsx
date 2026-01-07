import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Ban, CheckCircle } from "lucide-react";
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

    useEffect(() => {
        if (isOpen && tripId && busId) {
            fetchData();
        }
    }, [isOpen, tripId, busId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Bus Layout
            const { data: busData, error: busError } = await supabase
                .from('buses')
                // @ts-ignore
                .select('seat_layout')
                .eq('bus_id', busId)
                .single();

            if (busError) throw busError;

            // 2. Fetch Trip Blocked Seats
            const { data: tripData, error: tripError } = await supabase
                .from('trips')
                // @ts-ignore
                .select('blocked_seats')
                .eq('trip_id', tripId)
                .single();

            if (tripError) throw tripError;

            // 3. Fetch Currently Booked Seats (to prevent blocking them or show them as taken)
            const { data: bookedData, error: bookedError } = await supabase
                .from('passengers')
                .select('seat_id, seats(seat_number)')
                .eq('trip_id', tripId)
                .eq('passenger_status', 'active');

            if (bookedError) throw bookedError;

            // Parse Layout
            const rawLayout = busData.seat_layout;
            const parsedLayout = typeof rawLayout === 'string' ? JSON.parse(rawLayout) : rawDataToLayout(rawLayout);

            setLayout(parsedLayout);

            // Parse Blocked Seats
            const rawBlocked = tripData.blocked_seats;
            let blockedList: string[] = [];
            if (Array.isArray(rawBlocked)) {
                blockedList = rawBlocked.map(String);
            }
            setBlockedSeats(blockedList);

            // Parse Booked Seats (if joining with seats table worked as expected in passengers query)
            // Note: passengers table might link to seats table via seat_id
            const bookedList = bookedData?.map((p: any) => p.seats?.seat_number) || [];
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

    const rawDataToLayout = (json: any): SeatLayout => {
        if (!json || !json.cells) {
            // Return a default legacy 4x10 layout if no custom layout exists
            return {
                rows: 10,
                cols: 5, // 2 + aisle + 2
                cells: [] // will generate on fly if empty
            };
        }
        return json;
    };

    const toggleSeatBlock = (seatLabel: string) => {
        if (bookedSeats.includes(seatLabel)) return; // Cannot block already booked seats

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
                // @ts-ignore
                .update({ blocked_seats: blockedSeats })
                .eq('trip_id', tripId);

            if (error) throw error;

            toast({
                title: "تم الحفظ",
                description: "تم تحديث قائمة المقاعد المحظورة بنجاح",
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

    // Helper to render grid
    const renderGrid = () => {
        if (!layout) return null;

        // Use specific layout if available, or generate default legacy grid
        const rows = layout.rows || 10;
        const cols = layout.cols || 5;
        const cells = layout.cells || [];

        // Create a 2D grid for rendering
        let grid: JSX.Element[] = [];

        // If we have custom cells definition
        if (cells.length > 0) {
            // Find max row/col to size the grid container
            const gridStyle = {
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '8px',
                maxWidth: '400px',
                margin: '0 auto'
            };

            // Fill grid spots
            const gridMap = Array(rows).fill(null).map(() => Array(cols).fill(null));
            cells.forEach((cell: any) => {
                if (cell.row < rows && cell.col < cols) {
                    gridMap[cell.row][cell.col] = cell;
                }
            });

            return (
                <div style={gridStyle}>
                    {gridMap.map((rowCells, rIndex) =>
                        rowCells.map((cell: any, cIndex: number) => {
                            const key = `${rIndex}-${cIndex}`;
                            if (!cell) return <div key={key} className="w-10 h-10" />; // Empty space

                            if (cell.type === 'aisle') return <div key={key} className="w-10 h-10" />;

                            if (cell.type === 'driver') {
                                return (
                                    <div key={key} className="w-10 h-10 bg-gray-300 rounded-md flex items-center justify-center text-xs text-gray-600 border border-gray-400 cursor-not-allowed">
                                        S
                                    </div>
                                );
                            }

                            const label = cell.label || `${rIndex + 1}${String.fromCharCode(65 + cIndex)}`;
                            const isBlocked = blockedSeats.includes(label);
                            const isBooked = bookedSeats.includes(label);

                            return (
                                <div
                                    key={key}
                                    onClick={() => !isBooked && toggleSeatBlock(label)}
                                    className={cn(
                                        "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold border cursor-pointer transition-colors relative",
                                        isBooked ? "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed" :
                                            isBlocked ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" :
                                                "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
                        })
                    )}
                </div>
            );
        }

        // Default Fallback (Standard 4 seats per row + aisle)
        return (
            <div className="flex flex-col gap-2 items-center">
                <p className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-md mb-2">
                    تنبيه: هذه الحافلة تستخدم المخطط الافتراضي
                </p>
                {Array.from({ length: 11 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4">
                        {/* Left Side */}
                        <div className="flex gap-2">
                            {['A', 'B'].map(col => {
                                const label = `${rowIndex + 1}${col}`;
                                const isBlocked = blockedSeats.includes(label);
                                return (
                                    <div
                                        key={label}
                                        onClick={() => toggleSeatBlock(label)}
                                        className={cn(
                                            "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold border cursor-pointer",
                                            isBlocked ? "bg-red-100 text-red-700 border-red-300" : "bg-white border-gray-300"
                                        )}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Aisle */}
                        <div className="w-6" />
                        {/* Right Side */}
                        <div className="flex gap-2">
                            {['C', 'D'].map(col => {
                                const label = `${rowIndex + 1}${col}`;
                                const isBlocked = blockedSeats.includes(label);
                                return (
                                    <div
                                        key={label}
                                        onClick={() => toggleSeatBlock(label)}
                                        className={cn(
                                            "w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold border cursor-pointer",
                                            isBlocked ? "bg-red-100 text-red-700 border-red-300" : "bg-white border-gray-300"
                                        )}
                                    >
                                        {label}
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
                        {routeInfo} - يمكنك حظر المقاعد (باللون الأحمر) لمنع حجزها.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {/* Legend */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-white border border-gray-300 rounded" />
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

                            {/* Grid */}
                            {renderGrid()}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSave} disabled={saving || loading} className="bg-red-600 hover:bg-red-700">
                        {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                        حفظ التغييرات
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Armchair,
    Grid3X3,
    Trash2,
    Plus,
    ArrowRight,
    ArrowLeft,
    X,
    Check,
    Zap,
    Coffee,
    DoorOpen,
    Settings2,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type CellType = 'seat' | 'aisle' | 'door' | 'stairs' | 'empty' | 'driver';

export interface SeatCell {
    id: string;
    type: CellType;
    label?: string;
    class?: 'standard' | 'vip';
    priceAdjustment?: number;
    row: number;
    col: number;
}

export interface SeatLayout {
    rows: number;
    cols: number;
    cells: SeatCell[];
}

interface SeatMapDesignerProps {
    initialLayout?: SeatLayout;
    onSave: (layout: SeatLayout) => void;
    onSaveAsTemplate?: (layout: SeatLayout) => void;
    onCancel: () => void;
}

const SeatMapDesigner: React.FC<SeatMapDesignerProps> = ({
    initialLayout,
    onSave,
    onSaveAsTemplate,
    onCancel
}) => {
    const [rows, setRows] = useState(initialLayout?.rows || 12);
    const [cols, setCols] = useState(initialLayout?.cols || 4);
    const [cells, setCells] = useState<SeatCell[]>(initialLayout?.cells || []);
    const [selectedCell, setSelectedCell] = useState<string | null>(null);
    const [brushType, setBrushType] = useState<CellType>('seat');
    const [brushClass, setBrushClass] = useState<'standard' | 'vip'>('standard');

    // Auto-numbering logic
    const handleAutoNumber = () => {
        let seatCounter = 1;
        const updatedCells = cells.map(cell => {
            if (cell.type === 'seat') {
                return { ...cell, label: (seatCounter++).toString() };
            }
            return cell;
        });
        setCells(updatedCells);
        toast({
            title: "تم الترقيم التلقائي",
            description: `تم ترقيم ${seatCounter - 1} مقعد بنجاح.`,
        });
    };

    // Initialize cells if empty or rows/cols change
    useEffect(() => {
        if (cells.length === 0) {
            const newCells: SeatCell[] = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    newCells.push({
                        id: `${r}-${c}`,
                        row: r,
                        col: c,
                        type: c === 2 ? 'aisle' : 'seat' // default layout for 2+2
                    });
                }
            }
            setCells(newCells);
        }
    }, []);

    const handleCellClick = (r: number, c: number) => {
        const cellId = `${r}-${c}`;
        const updatedCells = [...cells];
        const index = updatedCells.findIndex(cell => cell.row === r && cell.col === c);

        if (index !== -1) {
            if (brushType === 'seat') {
                // Auto-generate seat label if needed
                const seatCount = updatedCells.filter(cell => cell.type === 'seat').length;
                updatedCells[index] = {
                    ...updatedCells[index],
                    type: 'seat',
                    class: brushClass,
                    label: `${seatCount + 1}`
                };
            } else {
                updatedCells[index] = {
                    ...updatedCells[index],
                    type: brushType,
                    label: brushType === 'driver' ? 'P' : undefined
                };
            }
            setCells(updatedCells);
            setSelectedCell(cellId);
        }
    };

    const getCellIcon = (type: CellType) => {
        switch (type) {
            case 'seat': return <Armchair className="w-5 h-5" />;
            case 'driver': return <Zap className="w-5 h-5 text-yellow-500" />;
            case 'door': return <DoorOpen className="w-5 h-5 text-blue-500" />;
            case 'aisle': return <div className="w-2 h-2 rounded-full bg-muted/20" />;
            default: return null;
        }
    };

    const currentCell = cells.find(c => c.id === selectedCell);

    return (
        <div className="flex flex-col h-[80vh] bg-background">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
                        <Grid3X3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">مصمم خرائط المقاعد</h2>
                        <p className="text-sm text-muted-foreground">صمم مخطط الحافلة (VIP أو عادية) بالسحب والإفلات</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleAutoNumber} className="hidden sm:flex gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        ترقيم تلقائي
                    </Button>
                    {onSaveAsTemplate && (
                        <Button variant="secondary" size="sm" onClick={() => onSaveAsTemplate({ rows, cols, cells })} className="gap-2">
                            <Plus className="w-4 h-4" />
                            حفظ كقالب
                        </Button>
                    )}
                    <Button variant="outline" onClick={onCancel}>إلغاء</Button>
                    <Button onClick={() => onSave({ rows, cols, cells })}>
                        <Check className="w-4 h-4 ml-2" />
                        حفظ المخطط
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Tools Sidebar */}
                <div className="w-80 border-l p-6 overflow-y-auto space-y-8">
                    <div>
                        <h3 className="text-sm font-black uppercase text-muted-foreground mb-4">الأبعاد</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الصفوف</Label>
                                <Input type="number" value={rows} onChange={(e) => setRows(parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>الأعمدة</Label>
                                <Input type="number" value={cols} onChange={(e) => setCols(parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-black uppercase text-muted-foreground mb-4">أدوات الرسم</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={brushType === 'seat' ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => setBrushType('seat')}
                            >
                                <Armchair className="w-4 h-4" /> مقعد
                            </Button>
                            <Button
                                variant={brushType === 'aisle' ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => setBrushType('aisle')}
                            >
                                <div className="w-2 h-2 rounded-full bg-current" /> ممر
                            </Button>
                            <Button
                                variant={brushType === 'door' ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => setBrushType('door')}
                            >
                                <DoorOpen className="w-4 h-4" /> باب
                            </Button>
                            <Button
                                variant={brushType === 'driver' ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => setBrushType('driver')}
                            >
                                <Zap className="w-4 h-4 text-yellow-500" /> سائق
                            </Button>
                        </div>
                    </div>

                    {brushType === 'seat' && (
                        <div>
                            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4">فئة المقعد</h3>
                            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                                <Button
                                    className={cn("flex-1", brushClass === 'standard' ? "bg-white text-black shadow-sm" : "bg-transparent text-muted-foreground")}
                                    onClick={() => setBrushClass('standard')}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Standard
                                </Button>
                                <Button
                                    className={cn("flex-1", brushClass === 'vip' ? "bg-primary text-white shadow-sm hover:bg-primary/90" : "bg-transparent text-muted-foreground")}
                                    onClick={() => setBrushClass('vip')}
                                    variant="ghost"
                                    size="sm"
                                >
                                    VIP
                                </Button>
                            </div>
                        </div>
                    )}

                    {selectedCell && currentCell && (
                        <Card className="p-4 border-primary/20 bg-primary/5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Settings2 className="w-4 h-4 text-primary" />
                                    خصائص الخلية
                                </h3>
                                <Badge variant="outline">{currentCell.id}</Badge>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>تسمية المقعد (Label)</Label>
                                    <Input
                                        value={currentCell.label || ''}
                                        onChange={(e) => {
                                            const updated = cells.map(c => c.id === selectedCell ? { ...c, label: e.target.value } : c);
                                            setCells(updated);
                                        }}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            قم باختيار أداة الرسم ثم اضغط على المربعات في المخطط لتطبيق التغيير. يمكنك تصميم أي توزيع مقاعد (مثل 2+1 للـ VIP).
                        </p>
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 bg-muted/30 p-12 overflow-auto flex justify-center items-start">
                    <div className="relative">
                        {/* Bus Wrapper */}
                        <div className="bg-white rounded-[40px] border-4 border-muted-foreground/20 shadow-2xl p-8 pt-16 min-w-[300px] relative">
                            {/* Windshield */}
                            <div className="absolute top-4 left-8 right-8 h-8 bg-blue-100 rounded-t-lg border-2 border-blue-200" />

                            {/* Grid */}
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                                {Array.from({ length: rows }).map((_, r) => (
                                    Array.from({ length: cols }).map((_, c) => {
                                        const cell = cells.find(cell => cell.row === r && cell.col === c);
                                        const isSelected = selectedCell === `${r}-${c}`;

                                        return (
                                            <div
                                                key={`${r}-${c}`}
                                                onClick={() => handleCellClick(r, c)}
                                                className={cn(
                                                    "w-12 h-12 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center relative group",
                                                    isSelected ? "border-primary shadow-lg ring-2 ring-primary/20 scale-105" : "border-muted/50 hover:border-muted-foreground/30 hover:bg-muted/10",
                                                    cell?.type === 'seat' && cell.class === 'vip' ? "bg-primary/10 border-primary/40 text-primary" : "",
                                                    cell?.type === 'aisle' ? "bg-muted/5 border-transparent pointer-events-auto" : "bg-white",
                                                    cell?.type === 'driver' ? "bg-yellow-50 border-yellow-200" : ""
                                                )}
                                            >
                                                {cell ? getCellIcon(cell.type) : null}
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {cell?.label}
                                                </span>
                                            </div>
                                        );
                                    })
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeatMapDesigner;

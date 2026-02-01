import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Star, Clock } from "lucide-react";
import { useDriverPerformance } from "@/hooks/useDrivers";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DriverPerformanceDialogProps {
    driverId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DriverPerformanceDialog = ({ driverId, open, onOpenChange }: DriverPerformanceDialogProps) => {
    const { data: performance, isLoading } = useDriverPerformance(driverId);

    const latestPerformance = performance?.[0];

    const chartData = performance?.slice(0, 6).reverse().map((p) => ({
        month: new Date(p.period_start).toLocaleDateString("ar-SA", { month: "short" }),
        trips: p.completed_trips,
        rating: p.average_rating || 0,
    }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>أداء السائق</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : latestPerformance ? (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        {/* Stats Cards with Gradients */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="border-0 shadow-sm bg-primary/5 hover:bg-primary/10 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">إجمالي الرحلات</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{latestPerformance.total_trips}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        مكتملة: {latestPerformance.completed_trips}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">متوسط التقييم</CardTitle>
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {latestPerformance.average_rating?.toFixed(1) || "N/A"}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        من {latestPerformance.total_ratings} تقييم
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm bg-green-500/5 hover:bg-green-500/10 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">نسبة الالتزام</CardTitle>
                                    <Clock className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {latestPerformance.on_time_percentage?.toFixed(0) || "0"}%
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 text-green-600/60 font-medium">في الوقت المحدد</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm bg-destructive/5 hover:bg-destructive/10 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">الرحلات الملغاة</CardTitle>
                                    <TrendingDown className="h-4 w-4 text-destructive" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{latestPerformance.cancelled_trips}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {latestPerformance.total_trips > 0
                                            ? ((latestPerformance.cancelled_trips / latestPerformance.total_trips) * 100).toFixed(1)
                                            : "0"}% من الإجمالي
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chart with Modern Look */}
                        <Card className="border-0 shadow-elegant overflow-hidden">
                            <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg">تطور الأداء (آخر 6 فترات)</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[0, 5]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="trips"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                                            name="الرحلات"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="rating"
                                            stroke="hsl(var(--secondary))"
                                            strokeWidth={3}
                                            dot={{ fill: 'hsl(var(--secondary))', r: 4 }}
                                            name="التقييم"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        لا توجد بيانات أداء متاحة
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

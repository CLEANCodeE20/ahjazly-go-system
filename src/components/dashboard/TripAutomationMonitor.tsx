import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Play, TrendingUp } from 'lucide-react';


interface AutomationStatus {
    pg_cron_enabled: boolean;
    function_exists: boolean;
    job_exists: boolean;
    job_active: boolean;
    last_run: string | null;
    last_status: string | null;
    system_healthy: boolean;
}

interface DelayedTrip {
    trip_id: number;
    status: string;
    departure_time: string;
    minutes_since_departure: number;
    origin_city: string;
    destination_city: string;
}

interface UpcomingTrip {
    trip_id: number;
    status: string;
    departure_time: string;
    minutes_until_departure: number;
    origin_city: string;
    destination_city: string;
    confirmed_bookings: number;
}

interface ExecutionLog {
    run_id: number;
    start_time: string;
    end_time: string;
    status: string;
    return_message: string;
    duration_seconds: number;
}

interface NotificationStat {
    notification_type: string;
    count: number;
    last_sent: string;
}

export default function TripAutomationMonitor() {
    const [status, setStatus] = useState<AutomationStatus | null>(null);
    const [delayedTrips, setDelayedTrips] = useState<DelayedTrip[]>([]);
    const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
    const [executionLog, setExecutionLog] = useState<ExecutionLog[]>([]);
    const [notificationStats, setNotificationStats] = useState<NotificationStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get automation status
            const { data: statusData } = await (supabase.rpc as any)('get_automation_status');
            setStatus(statusData);

            // Get delayed trips
            const { data: delayedData } = await (supabase.rpc as any)('get_delayed_trips');
            setDelayedTrips(delayedData || []);

            // Get upcoming trips
            const { data: upcomingData } = await (supabase.rpc as any)('get_upcoming_trips', { p_hours: 2 });
            setUpcomingTrips(upcomingData || []);

            // Get execution log
            const { data: logData } = await (supabase.rpc as any)('get_automation_execution_log', { p_limit: 10 });
            setExecutionLog(logData || []);

            // Get notification stats
            const { data: statsData } = await (supabase.rpc as any)('get_trip_notification_stats', { p_hours: 24 });
            setNotificationStats(statsData || []);

            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualTrigger = async () => {
        setTriggering(true);
        try {
            const { data, error } = await (supabase.rpc as any)('manual_trigger_trip_automation');
            if (error) throw error;

            alert(data.message);
            await fetchData(); // Refresh data after manual trigger
        } catch (error) {
            console.error('Error triggering automation:', error);
            alert('فشل التشغيل اليدوي');
        } finally {
            setTriggering(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !status) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">مراقبة النظام التلقائي</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </button>
                    <button
                        onClick={handleManualTrigger}
                        disabled={triggering}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" />
                        {triggering ? 'جاري التشغيل...' : 'تشغيل يدوي'}
                    </button>
                </div>
            </div>

            {/* System Status Card */}
            <div className={`p-6 rounded-lg border-2 ${status?.system_healthy
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
                }`}>
                <div className="flex items-center gap-3 mb-4">
                    {status?.system_healthy ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                        <h3 className="text-lg font-bold">
                            {status?.system_healthy ? 'النظام يعمل بشكل صحيح ✓' : 'تحذير: مشكلة في النظام'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            آخر تشغيل: {status?.last_run ? new Date(status.last_run).toLocaleString('ar-SA') : 'لم يتم التشغيل بعد'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatusItem
                        label="pg_cron"
                        value={status?.pg_cron_enabled}
                    />
                    <StatusItem
                        label="الدالة التلقائية"
                        value={status?.function_exists}
                    />
                    <StatusItem
                        label="الوظيفة المجدولة"
                        value={status?.job_exists}
                    />
                    <StatusItem
                        label="الوظيفة نشطة"
                        value={status?.job_active}
                    />
                </div>
            </div>

            {/* Delayed Trips Alert */}
            {delayedTrips.length > 0 && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-bold text-yellow-900">
                            تحذير: {delayedTrips.length} رحلة متأخرة في التحديث
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {delayedTrips.map((trip) => (
                            <div key={trip.trip_id} className="text-sm bg-white p-3 rounded">
                                <span className="font-medium">رحلة #{trip.trip_id}</span>
                                {' - '}
                                <span>{trip.origin_city} → {trip.destination_city}</span>
                                {' - '}
                                <span className="text-red-600">
                                    متأخرة {Math.round(trip.minutes_since_departure)} دقيقة
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notification Statistics */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    إحصائيات التنبيهات (آخر 24 ساعة)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {notificationStats.map((stat) => (
                        <div key={stat.notification_type} className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stat.count}</div>
                            <div className="text-sm text-gray-600 mt-1">{stat.notification_type}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                آخر إرسال: {new Date(stat.last_sent).toLocaleTimeString('ar-SA')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming Trips */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    الرحلات القادمة (خلال ساعتين)
                </h3>
                {upcomingTrips.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لا توجد رحلات قادمة</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رقم الرحلة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المسار</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">وقت الانطلاق</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الوقت المتبقي</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحجوزات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {upcomingTrips.map((trip) => (
                                    <tr key={trip.trip_id}>
                                        <td className="px-4 py-3 text-sm">#{trip.trip_id}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {trip.origin_city} → {trip.destination_city}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {new Date(trip.departure_time).toLocaleString('ar-SA')}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${trip.minutes_until_departure < 30
                                                ? 'bg-red-100 text-red-800'
                                                : trip.minutes_until_departure < 60
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {Math.round(trip.minutes_until_departure)} دقيقة
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{trip.confirmed_bookings}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Execution Log */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4">سجل التنفيذ (آخر 10 عمليات)</h3>
                {executionLog.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لا يوجد سجل تنفيذ</p>
                ) : (
                    <div className="space-y-2">
                        {executionLog.map((log) => (
                            <div
                                key={log.run_id}
                                className={`p-3 rounded-lg border ${log.status === 'succeeded'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {log.status === 'succeeded' ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                        )}
                                        <span className="text-sm font-medium">
                                            {new Date(log.start_time).toLocaleString('ar-SA')}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {log.duration_seconds}s
                                    </span>
                                </div>
                                {log.return_message && (
                                    <p className="text-xs text-gray-600 mt-1 mr-6">{log.return_message}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusItem({ label, value }: { label: string; value?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {value ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm">{label}</span>
        </div>
    );
}

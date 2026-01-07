import { useState } from "react";
import {
    Monitor,
    Smartphone,
    Tablet,
    MapPin,
    Clock,
    LogOut,
    Shield,
    Activity,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessions } from "@/hooks/useSessions";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";

const SessionManager = () => {
    const {
        sessions,
        loginHistory,
        activityLog,
        loading,
        revokeSession,
        revokeAllOtherSessions
    } = useSessions();

    const [revokingSession, setRevokingSession] = useState<string | null>(null);

    const getDeviceIcon = (deviceType: string | null) => {
        switch (deviceType?.toLowerCase()) {
            case 'mobile':
                return <Smartphone className="w-4 h-4" />;
            case 'tablet':
                return <Tablet className="w-4 h-4" />;
            default:
                return <Monitor className="w-4 h-4" />;
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        setRevokingSession(sessionId);
        const success = await revokeSession(sessionId);

        if (success) {
            toast({
                title: "تم إنهاء الجلسة",
                description: "تم إنهاء الجلسة بنجاح"
            });
        } else {
            toast({
                title: "خطأ",
                description: "فشل في إنهاء الجلسة",
                variant: "destructive"
            });
        }

        setRevokingSession(null);
    };

    const handleRevokeAllOthers = async () => {
        if (!confirm('هل أنت متأكد من إنهاء جميع الجلسات الأخرى؟')) return;

        const success = await revokeAllOtherSessions();

        if (success) {
            toast({
                title: "تم إنهاء الجلسات",
                description: "تم إنهاء جميع الجلسات الأخرى بنجاح"
            });
        } else {
            toast({
                title: "خطأ",
                description: "فشل في إنهاء الجلسات",
                variant: "destructive"
            });
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'login':
            case 'logout':
                return <LogOut className="w-4 h-4" />;
            case 'profile_update':
                return <Activity className="w-4 h-4" />;
            case 'password_change':
                return <Shield className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityLabel = (type: string) => {
        const labels: Record<string, string> = {
            'login': 'تسجيل دخول',
            'logout': 'تسجيل خروج',
            'profile_update': 'تحديث الملف الشخصي',
            'password_change': 'تغيير كلمة المرور',
            'avatar_upload': 'رفع صورة شخصية',
            'email_verification': 'التحقق من البريد',
            'phone_verification': 'التحقق من الهاتف'
        };
        return labels[type] || type;
    };

    return (
        <DashboardLayout
            title="الأمان والجلسات"
            subtitle="إدارة جلساتك النشطة وسجل الأنشطة"
        >
            <Tabs defaultValue="sessions" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sessions">الجلسات النشطة</TabsTrigger>
                    <TabsTrigger value="history">سجل الدخول</TabsTrigger>
                    <TabsTrigger value="activity">سجل الأنشطة</TabsTrigger>
                </TabsList>

                {/* Active Sessions Tab */}
                <TabsContent value="sessions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>الجلسات النشطة</CardTitle>
                                    <CardDescription>
                                        إدارة الأجهزة المتصلة بحسابك
                                    </CardDescription>
                                </div>
                                {sessions.length > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRevokeAllOthers}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <LogOut className="w-4 h-4 ml-2" />
                                        إنهاء الجلسات الأخرى
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    جاري التحميل...
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    لا توجد جلسات نشطة
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sessions.map((session) => (
                                        <div
                                            key={session.session_id}
                                            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                {getDeviceIcon(session.device_type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">
                                                        {session.device_name || session.browser || 'جهاز غير معروف'}
                                                    </h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {session.os || 'نظام غير معروف'}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-1 text-sm text-muted-foreground">
                                                    {session.location && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            <span>
                                                                {session.location.city}, {session.location.country}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            آخر نشاط: {new Date(session.last_activity_at).toLocaleString('ar-SA')}
                                                        </span>
                                                    </div>

                                                    {session.ip_address && (
                                                        <div className="text-xs font-mono" dir="ltr">
                                                            IP: {session.ip_address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevokeSession(session.session_id)}
                                                disabled={revokingSession === session.session_id}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Login History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>سجل تسجيلات الدخول</CardTitle>
                            <CardDescription>
                                آخر 20 محاولة لتسجيل الدخول
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    جاري التحميل...
                                </div>
                            ) : loginHistory.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    لا يوجد سجل متاح
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right">الحالة</TableHead>
                                                <TableHead className="text-right">الطريقة</TableHead>
                                                <TableHead className="text-right">الجهاز</TableHead>
                                                <TableHead className="text-right">الموقع</TableHead>
                                                <TableHead className="text-right">التاريخ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loginHistory.map((entry) => (
                                                <TableRow key={entry.login_id}>
                                                    <TableCell>
                                                        {entry.success ? (
                                                            <Badge variant="default" className="gap-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                نجح
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                فشل
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.login_method === 'email_password' ? 'بريد وكلمة مرور' : entry.login_method}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getDeviceIcon(entry.device_info?.type)}
                                                            <span className="text-sm">
                                                                {entry.device_info?.name || 'غير معروف'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.location?.city || 'غير معروف'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(entry.created_at).toLocaleString('ar-SA')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Log Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>سجل الأنشطة</CardTitle>
                            <CardDescription>
                                آخر 50 نشاط على حسابك
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    جاري التحميل...
                                </div>
                            ) : activityLog.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    لا يوجد سجل متاح
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activityLog.map((activity) => (
                                        <div
                                            key={activity.activity_id}
                                            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                {getActivityIcon(activity.activity_type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">
                                                        {getActivityLabel(activity.activity_type)}
                                                    </span>
                                                    {activity.activity_category && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {activity.activity_category}
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant={activity.status === 'success' ? 'default' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {activity.status === 'success' ? 'نجح' : 'فشل'}
                                                    </Badge>
                                                </div>

                                                {activity.description && (
                                                    <p className="text-sm text-muted-foreground mb-1">
                                                        {activity.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>
                                                        {new Date(activity.created_at).toLocaleString('ar-SA')}
                                                    </span>
                                                    {activity.ip_address && (
                                                        <span className="font-mono" dir="ltr">
                                                            {activity.ip_address}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
};

export default SessionManager;

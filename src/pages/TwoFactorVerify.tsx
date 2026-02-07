import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Loader2, AlertTriangle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { use2FA } from "@/hooks/use2FA";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const TwoFactorVerify = () => {
    console.log('[TwoFactorVerify] Mounted');
    const navigate = useNavigate();
    const location = useLocation();
    const { verify } = use2FA();
    const { user, userRole } = useAuth();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const maxAttempts = 5;

    useEffect(() => {
        console.log('[2FA_VERIFY] Mounted');
    }, []);

    const handleVerify = async () => {
        if (code.length !== 6) {
            toast({
                title: 'خطأ',
                description: 'يجب أن يكون الرمز مكوناً من 6 أرقام',
                variant: 'destructive'
            });
            return;
        }

        if (attempts >= maxAttempts) {
            toast({
                title: 'تم تجاوز الحد الأقصى',
                description: 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);
        const success = await verify(code, useBackupCode);

        if (success) {
            // Store 2FA verification in session
            sessionStorage.setItem('2fa_verified', 'true');

            // Redirect based on role
            const from = location.state?.from?.pathname || getDefaultRoute();
            navigate(from, { replace: true });
        } else {
            setAttempts(prev => prev + 1);
            setCode('');
        }

        setLoading(false);
    };

    const getDefaultRoute = () => {
        if (userRole?.role === 'SUPERUSER') return '/admin';
        if (userRole?.role === 'PARTNER_ADMIN') return '/dashboard';
        if (['manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant'].includes(userRole?.role || '')) return '/dashboard';
        return '/';
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.length === 6) {
            handleVerify();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">التحقق الثنائي</CardTitle>
                    <CardDescription>
                        أدخل رمز التحقق من تطبيق المصادقة
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {attempts > 0 && attempts < maxAttempts && (
                        <Alert variant="destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                                الرمز غير صحيح. المحاولات المتبقية: {maxAttempts - attempts}
                            </AlertDescription>
                        </Alert>
                    )}

                    {attempts >= maxAttempts && (
                        <Alert variant="destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                                تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قبل المحاولة مرة أخرى.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="code">
                            {useBackupCode ? 'الرمز الاحتياطي' : 'رمز التحقق'}
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            onKeyPress={handleKeyPress}
                            placeholder="000000"
                            className="text-center text-3xl tracking-widest font-mono"
                            dir="ltr"
                            disabled={loading || attempts >= maxAttempts}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            {useBackupCode
                                ? 'أدخل أحد الرموز الاحتياطية التي حفظتها'
                                : 'افتح تطبيق المصادقة واحصل على الرمز'}
                        </p>
                    </div>

                    <Button
                        onClick={handleVerify}
                        disabled={code.length !== 6 || loading || attempts >= maxAttempts}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                جاري التحقق...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 ml-2" />
                                تحقق
                            </>
                        )}
                    </Button>

                    <div className="text-center">
                        <Button
                            variant="link"
                            onClick={() => setUseBackupCode(!useBackupCode)}
                            disabled={loading}
                            className="text-sm"
                        >
                            {useBackupCode ? (
                                <>
                                    <Shield className="w-3 h-3 ml-1" />
                                    استخدام رمز التطبيق
                                </>
                            ) : (
                                <>
                                    <Key className="w-3 h-3 ml-1" />
                                    استخدام رمز احتياطي
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground text-center mb-2">
                            هل فقدت الوصول لتطبيق المصادقة؟
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                toast({
                                    title: 'تواصل مع الدعم',
                                    description: 'يرجى التواصل مع فريق الدعم لاستعادة الوصول لحسابك'
                                });
                            }}
                        >
                            تواصل مع الدعم
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TwoFactorVerify;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Shield,
    Smartphone,
    Copy,
    Check,
    AlertTriangle,
    ArrowLeft,
    Loader2,
    Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { use2FA } from "@/hooks/use2FA";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import QRCode from "qrcode";

const TwoFactorSetup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, status, getStatus, setup, verifyAndEnable, disable } = use2FA();

    const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup'>('status');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [disableCode, setDisableCode] = useState('');
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedBackup, setCopiedBackup] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        await getStatus();
    };

    const handleSetup = async () => {
        try {
            console.log('Initiating 2FA setup...');
            const setupData = await setup();
            console.log('Setup data received:', setupData);

            if (setupData) {
                setSecret(setupData.secret);
                setBackupCodes(setupData.backupCodes);

                // Generate QR code
                try {
                    const qrUrl = await QRCode.toDataURL(setupData.qrCodeUri);
                    setQrCodeUrl(qrUrl);
                    setStep('setup');
                } catch (error) {
                    console.error('Error generating QR code:', error);
                }
            }
        } catch (error: any) {
            console.error('Detailed setup error:', {
                message: error.message,
                status: error.status,
                details: error.details,
                body: error.body
            });
        }
    };

    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            return;
        }

        const success = await verifyAndEnable(verificationCode);
        if (success) {
            // Set session storage and update local state to avoid guard redirection
            sessionStorage.setItem('2fa_verified', 'true');
            setStep('backup');
        }
    };

    const handleDisable = async () => {
        if (disableCode.length !== 6) {
            return;
        }

        const success = await disable(disableCode);
        if (success) {
            setShowDisableDialog(false);
            setDisableCode('');
            await loadStatus();
            setStep('status');
        }
    };

    const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                if (type === 'secret') {
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                } else {
                    setCopiedBackup(true);
                    setTimeout(() => setCopiedBackup(false), 2000);
                }
            } else {
                // Fallback for non-secure contexts (HTTP)
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    if (type === 'secret') {
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                    } else {
                        setCopiedBackup(true);
                        setTimeout(() => setCopiedBackup(false), 2000);
                    }
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleFinish = () => {
        // Double check session flag is set
        sessionStorage.setItem('2fa_verified', 'true');

        // Load status to update UI before navigation
        loadStatus();

        // Navigate to dashboard or return to previous page
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
    };

    return (
        <DashboardLayout
            title="المصادقة الثنائية"
            subtitle="حماية إضافية لحسابك"
        >
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Status View */}
                {step === 'status' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        حالة المصادقة الثنائية
                                    </CardTitle>
                                    <CardDescription>
                                        أضف طبقة أمان إضافية لحسابك
                                    </CardDescription>
                                </div>
                                {status?.enabled && (
                                    <Badge variant="default" className="gap-1">
                                        <Check className="w-3 h-3" />
                                        مفعّلة
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!status?.enabled ? (
                                <>
                                    <Alert>
                                        <AlertTriangle className="w-4 h-4" />
                                        <AlertDescription>
                                            المصادقة الثنائية غير مفعّلة. قم بتفعيلها لحماية حسابك بشكل أفضل.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold">كيف تعمل المصادقة الثنائية؟</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-primary">1</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">قم بمسح رمز QR</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        استخدم تطبيق المصادقة مثل Google Authenticator أو Authy
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-primary">2</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">احفظ الرموز الاحتياطية</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        استخدمها في حالة فقدان الوصول لتطبيق المصادقة
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-primary">3</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">أدخل الرمز عند تسجيل الدخول</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        سيُطلب منك رمز من 6 أرقام في كل مرة تسجل فيها الدخول
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={handleSetup} disabled={loading} className="w-full">
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                        ) : (
                                            <Shield className="w-4 h-4 ml-2" />
                                        )}
                                        تفعيل المصادقة الثنائية
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b">
                                            <span className="text-muted-foreground">الطريقة</span>
                                            <span className="font-medium">TOTP (تطبيق المصادقة)</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b">
                                            <span className="text-muted-foreground">تاريخ التفعيل</span>
                                            <span className="font-medium">
                                                {status.enabledAt ? new Date(status.enabledAt).toLocaleDateString('ar-SA') : '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <span className="text-muted-foreground">آخر استخدام</span>
                                            <span className="font-medium">
                                                {status.lastUsedAt ? new Date(status.lastUsedAt).toLocaleString('ar-SA') : 'لم يُستخدم بعد'}
                                            </span>
                                        </div>
                                    </div>

                                    <Alert variant="destructive">
                                        <AlertTriangle className="w-4 h-4" />
                                        <AlertDescription>
                                            تعطيل المصادقة الثنائية سيجعل حسابك أقل أماناً
                                        </AlertDescription>
                                    </Alert>

                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowDisableDialog(true)}
                                        className="w-full"
                                    >
                                        تعطيل المصادقة الثنائية
                                    </Button>
                                </>
                            )}

                            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
                                <ArrowLeft className="w-4 h-4 ml-2" />
                                رجوع
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Setup View - QR Code */}
                {step === 'setup' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>مسح رمز QR</CardTitle>
                            <CardDescription>
                                استخدم تطبيق المصادقة لمسح الرمز
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {qrCodeUrl && (
                                <div className="flex flex-col items-center gap-4">
                                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border rounded-lg" />

                                    <Alert>
                                        <Smartphone className="w-4 h-4" />
                                        <AlertDescription>
                                            افتح تطبيق المصادقة (Google Authenticator أو Authy) وامسح الرمز أعلاه
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>أو أدخل المفتاح يدوياً</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={secret}
                                        readOnly
                                        className="font-mono text-sm"
                                        dir="ltr"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(secret, 'secret')}
                                    >
                                        {copiedSecret ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={() => setStep('verify')} className="w-full">
                                التالي: التحقق
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Verify View */}
                {step === 'verify' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>التحقق من الإعداد</CardTitle>
                            <CardDescription>
                                أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="code">رمز التحقق</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-widest font-mono"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('setup')}
                                    className="flex-1"
                                >
                                    رجوع
                                </Button>
                                <Button
                                    onClick={handleVerify}
                                    disabled={verificationCode.length !== 6 || loading}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 ml-2" />
                                    )}
                                    تحقق وفعّل
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Backup Codes View */}
                {step === 'backup' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                الرموز الاحتياطية
                            </CardTitle>
                            <CardDescription>
                                احفظ هذه الرموز في مكان آمن. يمكنك استخدامها إذا فقدت الوصول لتطبيق المصادقة.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert variant="destructive">
                                <AlertTriangle className="w-4 h-4" />
                                <AlertDescription>
                                    <strong>مهم جداً:</strong> لن تتمكن من رؤية هذه الرموز مرة أخرى. احفظها الآن!
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm" dir="ltr">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="text-center py-2">
                                        {code}
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                                className="w-full"
                            >
                                {copiedBackup ? (
                                    <>
                                        <Check className="w-4 h-4 ml-2 text-green-600" />
                                        تم النسخ
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 ml-2" />
                                        نسخ جميع الرموز
                                    </>
                                )}
                            </Button>

                            <Button onClick={handleFinish} className="w-full">
                                <Check className="w-4 h-4 ml-2" />
                                تم - إنهاء الإعداد
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Disable Dialog */}
                {showDisableDialog && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">تعطيل المصادقة الثنائية</CardTitle>
                            <CardDescription>
                                أدخل رمز التحقق من تطبيق المصادقة لتأكيد التعطيل
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="disable-code">رمز التحقق</Label>
                                <Input
                                    id="disable-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-widest font-mono"
                                    dir="ltr"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDisableDialog(false);
                                        setDisableCode('');
                                    }}
                                    className="flex-1"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDisable}
                                    disabled={disableCode.length !== 6 || loading}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : null}
                                    تعطيل
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default TwoFactorSetup;

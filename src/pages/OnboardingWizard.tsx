import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    Mail,
    Phone,
    Loader2,
    ArrowRight,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useVerification } from "@/hooks/useVerification";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";

const steps = [
    { id: 1, title: 'التحقق من البريد', icon: Mail },
    { id: 2, title: 'التحقق من الهاتف', icon: Phone },
    { id: 3, title: 'إعداد المصادقة الثنائية', icon: Shield },
];

const OnboardingWizard = () => {
    const navigate = useNavigate();
    const { profile, completeOnboarding } = useUserProfile();
    const { loading, codeSent, sendCode, verifyCode, reset } = useVerification();

    const [currentStep, setCurrentStep] = useState(1);
    const [emailCode, setEmailCode] = useState('');
    const [phoneCode, setPhoneCode] = useState('');

    const progress = (currentStep / steps.length) * 100;

    const handleSendEmailCode = async () => {
        if (!profile?.email) {
            toast({
                title: 'خطأ',
                description: 'البريد الإلكتروني غير متوفر',
                variant: 'destructive'
            });
            return;
        }

        await sendCode('email', profile.email);
    };

    const handleVerifyEmail = async () => {
        if (emailCode.length !== 6) return;

        const success = await verifyCode('email', emailCode);
        if (success) {
            reset();
            setEmailCode('');
            setCurrentStep(2);
        }
    };

    const handleSendPhoneCode = async () => {
        if (!profile?.phone_number) {
            toast({
                title: 'خطأ',
                description: 'رقم الهاتف غير متوفر',
                variant: 'destructive'
            });
            return;
        }

        await sendCode('phone', profile.phone_number);
    };

    const handleVerifyPhone = async () => {
        if (phoneCode.length !== 6) return;

        const success = await verifyCode('phone', phoneCode);
        if (success) {
            reset();
            setPhoneCode('');
            setCurrentStep(3);
        }
    };

    const handleSetup2FA = () => {
        navigate('/2fa-setup');
    };

    const handleSkip = async () => {
        await completeOnboarding();
        navigate('/dashboard');
    };

    const handleFinish = async () => {
        await completeOnboarding();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="space-y-4">
                        <CardTitle className="text-2xl text-center">إعداد حسابك</CardTitle>
                        <CardDescription className="text-center">
                            خطوة {currentStep} من {steps.length}
                        </CardDescription>
                        <Progress value={progress} className="h-2" />

                        <div className="flex justify-between pt-4">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                const isCompleted = currentStep > step.id;
                                const isCurrent = currentStep === step.id;

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex flex-col items-center gap-2 flex-1 ${isCompleted ? 'text-primary' : isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                            }`}
                                    >
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isCompleted
                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                    : isCurrent
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-muted-foreground/20'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6" />
                                            ) : (
                                                <Icon className="w-6 h-6" />
                                            )}
                                        </div>
                                        <span className="text-xs text-center hidden sm:block">{step.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Step 1: Email Verification */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <Mail className="w-16 h-16 mx-auto text-primary" />
                                <h3 className="text-xl font-semibold">التحقق من البريد الإلكتروني</h3>
                                <p className="text-muted-foreground">
                                    سنرسل رمز تحقق إلى بريدك الإلكتروني
                                </p>
                                <p className="font-medium">{profile?.email}</p>
                            </div>

                            {!codeSent ? (
                                <Button onClick={handleSendEmailCode} disabled={loading} className="w-full" size="lg">
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <Mail className="w-4 h-4 ml-2" />
                                    )}
                                    إرسال رمز التحقق
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email-code">رمز التحقق</Label>
                                        <Input
                                            id="email-code"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={emailCode}
                                            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="text-center text-2xl tracking-widest font-mono"
                                            dir="ltr"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleSendEmailCode}
                                            disabled={loading}
                                            className="flex-1"
                                        >
                                            إعادة الإرسال
                                        </Button>
                                        <Button
                                            onClick={handleVerifyEmail}
                                            disabled={emailCode.length !== 6 || loading}
                                            className="flex-1"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            )}
                                            تحقق
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Phone Verification */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <Phone className="w-16 h-16 mx-auto text-primary" />
                                <h3 className="text-xl font-semibold">التحقق من رقم الهاتف</h3>
                                <p className="text-muted-foreground">
                                    سنرسل رمز تحقق عبر WhatsApp
                                </p>
                                <p className="font-medium" dir="ltr">{profile?.phone_number}</p>
                            </div>

                            {!codeSent ? (
                                <Button onClick={handleSendPhoneCode} disabled={loading} className="w-full" size="lg">
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    ) : (
                                        <Phone className="w-4 h-4 ml-2" />
                                    )}
                                    إرسال رمز التحقق
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone-code">رمز التحقق</Label>
                                        <Input
                                            id="phone-code"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={phoneCode}
                                            onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="text-center text-2xl tracking-widest font-mono"
                                            dir="ltr"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleSendPhoneCode}
                                            disabled={loading}
                                            className="flex-1"
                                        >
                                            إعادة الإرسال
                                        </Button>
                                        <Button
                                            onClick={handleVerifyPhone}
                                            disabled={phoneCode.length !== 6 || loading}
                                            className="flex-1"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            )}
                                            تحقق
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: 2FA Setup */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <Shield className="w-16 h-16 mx-auto text-primary" />
                                <h3 className="text-xl font-semibold">المصادقة الثنائية</h3>
                                <p className="text-muted-foreground">
                                    أضف طبقة أمان إضافية لحسابك
                                </p>
                            </div>

                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <h4 className="font-semibold">لماذا المصادقة الثنائية؟</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>✓ حماية إضافية لحسابك</li>
                                    <li>✓ منع الوصول غير المصرح به</li>
                                    <li>✓ مطلوبة لجميع المستخدمين</li>
                                </ul>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSkip}
                                    className="flex-1"
                                >
                                    تخطي الآن
                                </Button>
                                <Button
                                    onClick={handleSetup2FA}
                                    className="flex-1"
                                >
                                    <Shield className="w-4 h-4 ml-2" />
                                    إعداد الآن
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep > 1 && (
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="w-full"
                        >
                            رجوع
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingWizard;

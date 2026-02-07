import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 font-sans" dir="rtl">
            <Card className="w-full max-w-md shadow-elegant border-border animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">غير مصرح بالوصول</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                        عذراً، ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة أو الميزة.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-6">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="default"
                        className="w-full h-11 transition-all hover:scale-[1.02]"
                    >
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للصفحة السابقة
                    </Button>

                    <Button
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        className="w-full h-11 transition-all hover:bg-muted"
                    >
                        <Home className="w-4 h-4 ml-2" />
                        الذهاب للوحة التحكم
                    </Button>

                    <div className="mt-6 pt-6 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مسؤول النظام أو الدعم الفني الخاص بشركتك.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Unauthorized;

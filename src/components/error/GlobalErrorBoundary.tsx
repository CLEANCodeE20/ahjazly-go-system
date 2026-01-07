
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Here you would log to Sentry
        // Sentry.captureException(error);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center" dir="rtl">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                    </div>

                    <h1 className="text-3xl font-bold mb-3 text-foreground">عذراً، حدث خطأ غير متوقع</h1>
                    <p className="text-muted-foreground max-w-md mb-8">
                        واجه النظام مشكلة تقنية بسيطة. لا تقلق، فريقنا سيتلقى تقريراً بهذا الخطأ.
                        الرجاء المحاولة مرة أخرى.
                    </p>

                    <div className="flex gap-4">
                        <Button
                            size="lg"
                            onClick={() => window.location.reload()}
                            className="gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            تحديث الصفحة
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.location.href = '/'}
                            className="gap-2"
                        >
                            <Home className="w-4 h-4" />
                            العودة للرئيسية
                        </Button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="mt-12 p-4 bg-muted/50 rounded-lg text-left dir-ltr w-full max-w-2xl overflow-auto text-xs font-mono text-destructive">
                            {this.state.error.toString()}
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * مكون حدود الأخطاء للتقارير
 * يتعامل مع الأخطاء في مكونات التقارير ويعرض رسالة بديلة
 */
import React from 'react';
import { ErrorLogger } from '../../utils/ErrorLogger';

interface ReportErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ReportErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError?: () => void }>;
}

class ReportErrorBoundary extends React.Component<
    ReportErrorBoundaryProps,
    ReportErrorBoundaryState
> {
    constructor(props: ReportErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ReportErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // تسجيل الخطأ
        ErrorLogger.log(error, 'ReportErrorBoundary');
        console.error('ReportErrorBoundary caught an error:', error, errorInfo);
    }

    resetError = (): void => {
        this.setState({ hasError: false, error: undefined });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            // إذا كان هناك مكون بديل مخصص
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            // المكون البديل الافتراضي
            return (
                <div className="report-error-boundary">
                    <div className="error-content">
                        <h3>عُثر على خطأ في التقرير</h3>
                        <p>يبدو أن هناك مشكلة في تحميل هذا التقرير.</p>
                        <div className="error-actions">
                            <button className="btn btn-primary" onClick={this.resetError}>
                                إعادة تحميل التقرير
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ReportErrorBoundary;

// مكون بديل مخصص لتقارير معينة
export const ReportFallback: React.FC<{
    error?: Error;
    resetError?: () => void;
}> = ({ error, resetError }) => {
    return (
        <div className="report-error-fallback">
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>حدث خطأ أثناء تحميل التقرير</h3>
                
                {error && (
                    <div className="error-details">
                        <p><strong>الرسالة:</strong> {error.message}</p>
                    </div>
                )}
                
                <div className="error-actions">
                    <button className="btn btn-outline" onClick={resetError}>
                        محاولة مرة أخرى
                    </button>
                    <a href="/dashboard/reports" className="btn btn-primary">
                        العودة للتقارير
                    </a>
                </div>
                
                <p className="error-help">
                    إذا استمرت المشكلة، يرجى الاتصال بالدعم الفني
                </p>
            </div>
        </div>
    );
};
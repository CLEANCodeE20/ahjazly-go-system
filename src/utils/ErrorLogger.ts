/**
 * Centralized Error Logger
 * Logs errors to console, Sentry, and localStorage for debugging
 */

interface ErrorData {
    message: string;
    stack?: string;
    context?: string;
    timestamp: string;
    url: string;
    userAgent: string;
}

export class ErrorLogger {
    /**
     * Log an error with context
     * @param error - The error object to log
     * @param context - Additional context about where/why the error occurred
     */
    static log(error: Error, context?: string): void {
        const errorData: ErrorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        };

        // Log to console with styling
        console.error(
            '%c[ErrorLogger]%c Error occurred',
            'color: #ff4444; font-weight: bold',
            'color: inherit',
            errorData
        );

        // Send to Sentry if available
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            try {
                (window as any).Sentry.captureException(error, {
                    extra: errorData,
                });
            } catch (sentryError) {
                console.error('[ErrorLogger] Failed to send to Sentry:', sentryError);
            }
        }

        // Store in localStorage for debugging (keep last 50 errors)
        try {
            const storageKey = 'app_errors';
            const existingErrors = localStorage.getItem(storageKey);
            const errors: ErrorData[] = existingErrors ? JSON.parse(existingErrors) : [];

            errors.push(errorData);

            // Keep only last 50 errors to prevent storage overflow
            const recentErrors = errors.slice(-50);

            localStorage.setItem(storageKey, JSON.stringify(recentErrors));
        } catch (storageError) {
            console.error('[ErrorLogger] Failed to store error in localStorage:', storageError);
        }
    }

    /**
     * Get all stored errors from localStorage
     * @returns Array of error data
     */
    static getStoredErrors(): ErrorData[] {
        try {
            const storageKey = 'app_errors';
            const existingErrors = localStorage.getItem(storageKey);
            return existingErrors ? JSON.parse(existingErrors) : [];
        } catch (error) {
            console.error('[ErrorLogger] Failed to retrieve stored errors:', error);
            return [];
        }
    }

    /**
     * Clear all stored errors from localStorage
     */
    static clearStoredErrors(): void {
        try {
            localStorage.removeItem('app_errors');
            console.log('[ErrorLogger] Cleared all stored errors');
        } catch (error) {
            console.error('[ErrorLogger] Failed to clear stored errors:', error);
        }
    }

    /**
     * Log a warning (non-critical issue)
     * @param message - Warning message
     * @param context - Additional context
     */
    static warn(message: string, context?: string): void {
        console.warn(
            '%c[ErrorLogger]%c Warning:',
            'color: #ff9800; font-weight: bold',
            'color: inherit',
            message,
            context || ''
        );
    }

    /**
     * Log info for debugging
     * @param message - Info message
     * @param data - Additional data
     */
    static info(message: string, data?: any): void {
        console.log(
            '%c[ErrorLogger]%c Info:',
            'color: #2196f3; font-weight: bold',
            'color: inherit',
            message,
            data || ''
        );
    }
}

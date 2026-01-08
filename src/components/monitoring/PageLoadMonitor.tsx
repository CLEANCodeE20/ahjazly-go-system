import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorLogger } from '@/utils/ErrorLogger';

/**
 * PageLoadMonitor
 * Monitors page load performance and detects rendering issues
 */
export const PageLoadMonitor = () => {
    const location = useLocation();

    useEffect(() => {
        const startTime = performance.now();
        const pathname = location.pathname;

        console.log(`[PageLoadMonitor] Loading page: ${pathname}`);

        // Check page load after a delay
        const checkPageLoad = setTimeout(() => {
            const loadTime = performance.now() - startTime;

            // Detect slow page loads (> 5 seconds)
            if (loadTime > 5000) {
                ErrorLogger.warn(
                    'Slow page load detected',
                    `Page: ${pathname}, Load time: ${loadTime.toFixed(2)}ms`
                );
            }

            // Check if content is visible
            const root = document.getElementById('root');
            if (!root || !root.innerHTML.trim()) {
                ErrorLogger.log(
                    new Error('Empty page content detected'),
                    `Page: ${pathname} - Root element is empty or missing`
                );
            } else {
                ErrorLogger.info(
                    `Page loaded successfully: ${pathname}`,
                    { loadTime: `${loadTime.toFixed(2)}ms` }
                );
            }
        }, 1000);

        return () => {
            clearTimeout(checkPageLoad);
        };
    }, [location]);

    return null;
};

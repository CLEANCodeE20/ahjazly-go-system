/**
 * خطاف لتخزين التقارير مؤقتًا لتحسين الأداء
 */
import { useState, useEffect, useCallback } from 'react';

// نوع البيانات المخزنة في ذاكرة التخزين المؤقت
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // وقت الحياة بالمللي ثانية
}

// نوع ذاكرة التخزين المؤقت
interface ReportCache {
    [key: string]: CacheEntry<any>;
}

// وظيفة للحصول على ذاكرة التخزين المؤقت من localStorage
const getCache = (): ReportCache => {
    try {
        const cacheString = localStorage.getItem('report_cache');
        return cacheString ? JSON.parse(cacheString) : {};
    } catch (error) {
        console.error('Error reading report cache:', error);
        return {};
    }
};

// وظيفة لحفظ ذاكرة التخزين المؤقت في localStorage
const setCache = (cache: ReportCache): void => {
    try {
        localStorage.setItem('report_cache', JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving report cache:', error);
    }
};

// وظيفة للتحقق من انتهاء صلاحية المدخل
const isExpired = (entry: CacheEntry<any>): boolean => {
    return Date.now() - entry.timestamp > entry.ttl;
};

// وظيفة لتنظيف المدخلات المنتهية
const cleanExpiredEntries = (): void => {
    const cache = getCache();
    let hasChanges = false;

    Object.keys(cache).forEach(key => {
        if (isExpired(cache[key])) {
            delete cache[key];
            hasChanges = true;
        }
    });

    if (hasChanges) {
        setCache(cache);
    }
};

// وظيفة لحذف مدخلات ذاكرة التخزين المؤقت بناءً على مفتاح
export const clearReportCache = (pattern?: string): void => {
    if (!pattern) {
        // حذف كل ذاكرة التخزين المؤقت
        localStorage.removeItem('report_cache');
        return;
    }

    const cache = getCache();
    let hasChanges = false;

    Object.keys(cache).forEach(key => {
        if (key.includes(pattern)) {
            delete cache[key];
            hasChanges = true;
        }
    });

    if (hasChanges) {
        setCache(cache);
    }
};

// الخطاف الرئيسي
export const useReportCache = <T,>(
    cacheKey: string,
    fetchDataFn: () => Promise<T>,
    ttl: number = 300000 // 5 دقائق افتراضيًا
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // تنظيف المدخلات المنتهية عند بدء الخطاف
    useEffect(() => {
        cleanExpiredEntries();
    }, []);

    // دالة لجلب البيانات مع التحقق من ذاكرة التخزين المؤقت
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // التحقق من ذاكرة التخزين المؤقت
            const cache = getCache();
            const cachedEntry = cache[cacheKey];

            if (cachedEntry && !isExpired(cachedEntry)) {
                // استخدام البيانات من ذاكرة التخزين المؤقت
                setData(cachedEntry.data);
                setLoading(false);
            } else {
                // جلب البيانات الجديدة
                const fetchedData = await fetchDataFn();
                
                // حفظ البيانات في ذاكرة التخزين المؤقت
                cache[cacheKey] = {
                    data: fetchedData,
                    timestamp: Date.now(),
                    ttl
                };
                
                setCache(cache);
                
                setData(fetchedData);
                setLoading(false);
            }
        } catch (err) {
            setError(err as Error);
            setLoading(false);
            console.error('Error loading report data:', err);
        }
    }, [cacheKey, fetchDataFn, ttl]);

    // جلب البيانات عند تحميل الخطاف
    useEffect(() => {
        loadData();
    }, [loadData]);

    // دالة لتحديث البيانات يدويًا (وتحديث ذاكرة التخزين المؤقت)
    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const fetchedData = await fetchDataFn();
            
            // تحديث ذاكرة التخزين المؤقت
            const cache = getCache();
            cache[cacheKey] = {
                data: fetchedData,
                timestamp: Date.now(),
                ttl
            };
            
            setCache(cache);
            
            setData(fetchedData);
            setLoading(false);
            
            return fetchedData;
        } catch (err) {
            setError(err as Error);
            setLoading(false);
            console.error('Error refreshing report data:', err);
            throw err;
        }
    }, [cacheKey, fetchDataFn, ttl]);

    // دالة لحذف مدخلة من ذاكرة التخزين المؤقت
    const removeFromCache = useCallback(() => {
        const cache = getCache();
        delete cache[cacheKey];
        setCache(cache);
    }, [cacheKey]);

    return {
        data,
        loading,
        error,
        refreshData,
        removeFromCache,
        isLoading: loading
    };
};

// وظيفة للحصول على البيانات مباشرة من ذاكرة التخزين المؤقت (بدون الخطاف)
export const getCachedReportData = <T,>(cacheKey: string): T | null => {
    const cache = getCache();
    const cachedEntry = cache[cacheKey];

    if (cachedEntry && !isExpired(cachedEntry)) {
        return cachedEntry.data as T;
    }

    return null;
};

// وظيفة لحفظ البيانات مباشرة في ذاكرة التخزين المؤقت (بدون الخطاف)
export const setCachedReportData = <T,>(cacheKey: string, data: T, ttl: number = 300000): void => {
    const cache = getCache();
    cache[cacheKey] = {
        data,
        timestamp: Date.now(),
        ttl
    };
    setCache(cache);
};
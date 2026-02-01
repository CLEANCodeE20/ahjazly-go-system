/**
 * مكون تصفح التقارير
 * يتيح للمستخدم التنقل بين صفحات التقرير الكبيرة
 */

import React, { useState, useEffect } from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    totalItems?: number;
    showGoToPage?: boolean;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    pageSize = 10,
    totalItems = 0,
    showGoToPage = true,
    className = ''
}) => {
    const [goToPage, setGoToPage] = useState<string>('');

    // التحقق من صحة الصفحة الحالية
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            onPageChange(totalPages);
        } else if (currentPage < 1 && totalPages > 0) {
            onPageChange(1);
        }
    }, [currentPage, totalPages, onPageChange]);

    // معالجة تغيير رقم الصفحة في الحقل
    const handleGoToPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // التأكد من أن القيمة رقم فقط
        if (/^\d*$/.test(value)) {
            setGoToPage(value);
        }
    };

    // الانتقال إلى صفحة محددة
    const goToSpecificPage = () => {
        const page = parseInt(goToPage);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    // معالجة ضغط Enter في حقل الانتقال إلى صفحة
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            goToSpecificPage();
        }
    };

    // عرض أرقام الصفحات القريبة من الصفحة الحالية
    const getPageNumbers = () => {
        const pages = [];
        const delta = 2; // عدد الصفحات الموضحة قبل وبعد الصفحة الحالية
        
        // دائمًا تضمين الصفحة الأولى
        pages.push(1);
        
        // إذا كانت الصفحة الحالية بعيدة بما فيه الكفاية، أضف نقاط حذف
        if (currentPage - delta > 2) {
            pages.push(-1); // سيتم عرضها كـ "... "
        }
        
        // أضف الصفحات القريبة من الصفحة الحالية
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            pages.push(i);
        }
        
        // إذا كانت الصفحة الحالية بعيدة عن آخر صفحة، أضف نقاط حذف
        if (currentPage + delta < totalPages - 1) {
            pages.push(-1); // سيتم عرضها كـ "... "
        }
        
        // دائمًا تضمين آخر صفحة (إذا لم تكن هي الأولى)
        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return pages;
    };

    if (totalPages <= 1) {
        return null; // لا حاجة لعرض التصفح إذا كانت هناك صفحة واحدة فقط
    }

    return (
        <div className={`pagination-container ${className}`}>
            <div className="pagination-info">
                {totalItems !== undefined && (
                    <span className="items-count">
                        {totalItems} عنصر • {totalPages} صفحة
                    </span>
                )}
                <span className="current-page">
                    الصفحة {currentPage} من {totalPages}
                </span>
            </div>

            <div className="pagination-controls">
                <button
                    className="btn btn-outline page-btn"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                >
                    &larr; السابقة
                </button>

                <div className="page-numbers">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === -1 ? (
                                <span className="page-ellipsis">...</span>
                            ) : (
                                <button
                                    className={`btn page-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    className="btn btn-outline page-btn"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                >
                    التالية &rarr;
                </button>
            </div>

            {showGoToPage && (
                <div className="go-to-page">
                    <label htmlFor="goto-page">الذهاب إلى:</label>
                    <input
                        id="goto-page"
                        type="text"
                        value={goToPage}
                        onChange={handleGoToPageChange}
                        onKeyPress={handleKeyPress}
                        placeholder="رقم الصفحة"
                        className="goto-input"
                    />
                    <button
                        className="btn btn-primary goto-btn"
                        onClick={goToSpecificPage}
                        disabled={!goToPage.trim()}
                    >
                        اذهب
                    </button>
                </div>
            )}
        </div>
    );
};

// مكون تصفح مبسط للاستخدام الداخلي
interface SimplePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange
}) => {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="simple-pagination">
            <button
                className="btn btn-outline"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
            >
                &larr; السابقة
            </button>
            
            <span className="page-indicator">
                {currentPage} من {totalPages}
            </span>
            
            <button
                className="btn btn-outline"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
            >
                التالية &rarr;
            </button>
        </div>
    );
};
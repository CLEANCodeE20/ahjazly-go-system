import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}: PaginationControlsProps) => {
    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
                عرض {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} إلى {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} مستخدم
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronRight className="h-4 w-4 ml-2" />
                    السابق
                </Button>
                <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                            if (currentPage > 3) pageNum = currentPage - 2 + i;
                            if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                        }

                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "ghost"}
                                size="sm"
                                onClick={() => onPageChange(pageNum)}
                                className="w-8 h-8 p-0"
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    التالي
                    <ChevronLeft className="h-4 w-4 mr-2" />
                </Button>
            </div>
        </div>
    );
};

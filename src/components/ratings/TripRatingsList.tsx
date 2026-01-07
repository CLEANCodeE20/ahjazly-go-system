import React, { useEffect, useState } from 'react';
import { RatingCard } from './RatingCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRatings } from '@/hooks/useRatings';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TripRatingsListProps {
    tripId: number;
    showResponseButton?: boolean;
    onRespond?: (ratingId: number) => void;
    onReport?: (ratingId: number) => void;
}

export const TripRatingsList: React.FC<TripRatingsListProps> = ({
    tripId,
    showResponseButton = false,
    onRespond,
    onReport,
}) => {
    const { ratings, loading, fetchTripRatings } = useRatings(tripId);
    const [page, setPage] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        if (tripId) {
            fetchTripRatings(tripId, pageSize, page * pageSize);
        }
    }, [tripId, page, fetchTripRatings]);

    const handleNextPage = () => {
        setPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(0, prev - 1));
    };

    if (loading && ratings.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
        );
    }

    if (ratings.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">لا توجد تقييمات لهذه الرحلة بعد</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {ratings.map(rating => (
                <RatingCard
                    key={rating.rating_id}
                    rating={rating}
                    showResponseButton={showResponseButton}
                    onRespond={onRespond}
                    onReport={onReport}
                />
            ))}

            {/* Pagination */}
            {ratings.length === pageSize && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={page === 0}
                    >
                        <ChevronRight className="w-4 h-4 ml-1" />
                        السابق
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        صفحة {page + 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={ratings.length < pageSize}
                    >
                        التالي
                        <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                </div>
            )}
        </div>
    );
};

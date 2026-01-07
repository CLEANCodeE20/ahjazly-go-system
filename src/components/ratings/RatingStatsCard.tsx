import React from 'react';
import { StarRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PartnerRatingStats } from '@/types/rating';

interface RatingStatsCardProps {
    stats: PartnerRatingStats;
}

export const RatingStatsCard: React.FC<RatingStatsCardProps> = ({ stats }) => {
    const totalRatings = stats.total_ratings || 0;

    const getRatingPercentage = (count: number) => {
        return totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>إحصائيات التقييمات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Rating */}
                <div className="text-center pb-4 border-b">
                    <div className="text-5xl font-bold text-primary mb-2">
                        {stats.avg_overall_rating?.toFixed(1) || '0.0'}
                    </div>
                    <StarRating
                        value={stats.avg_overall_rating || 0}
                        readonly
                        size="lg"
                        className="justify-center mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                        بناءً على {totalRatings} تقييم
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">توزيع التقييمات</h4>
                    {[5, 4, 3, 2, 1].map(stars => {
                        const count =
                            stars === 5 ? stats.five_star_count :
                                stars === 4 ? stats.four_star_count :
                                    stars === 3 ? stats.three_star_count :
                                        stars === 2 ? stats.two_star_count :
                                            stats.one_star_count;

                        const percentage = getRatingPercentage(count || 0);

                        return (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm w-12">{stars} نجوم</span>
                                <Progress value={percentage} className="flex-1" />
                                <span className="text-sm text-muted-foreground w-12 text-left">
                                    {count || 0}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Detailed Ratings */}
                {(stats.avg_service_rating || stats.avg_cleanliness_rating) && (
                    <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-semibold text-sm">التقييمات التفصيلية</h4>

                        {stats.avg_service_rating && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">الخدمة</span>
                                <div className="flex items-center gap-2">
                                    <StarRating value={stats.avg_service_rating} readonly size="sm" />
                                    <span className="text-sm font-medium">
                                        {stats.avg_service_rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {stats.avg_cleanliness_rating && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">النظافة</span>
                                <div className="flex items-center gap-2">
                                    <StarRating value={stats.avg_cleanliness_rating} readonly size="sm" />
                                    <span className="text-sm font-medium">
                                        {stats.avg_cleanliness_rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {stats.avg_punctuality_rating && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">المواعيد</span>
                                <div className="flex items-center gap-2">
                                    <StarRating value={stats.avg_punctuality_rating} readonly size="sm" />
                                    <span className="text-sm font-medium">
                                        {stats.avg_punctuality_rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {stats.avg_comfort_rating && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">الراحة</span>
                                <div className="flex items-center gap-2">
                                    <StarRating value={stats.avg_comfort_rating} readonly size="sm" />
                                    <span className="text-sm font-medium">
                                        {stats.avg_comfort_rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {stats.avg_value_rating && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">القيمة مقابل السعر</span>
                                <div className="flex items-center gap-2">
                                    <StarRating value={stats.avg_value_rating} readonly size="sm" />
                                    <span className="text-sm font-medium">
                                        {stats.avg_value_rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {stats.positive_percentage?.toFixed(0) || 0}%
                        </div>
                        <div className="text-xs text-green-700">تقييمات إيجابية</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                            {stats.negative_percentage?.toFixed(0) || 0}%
                        </div>
                        <div className="text-xs text-red-700">تقييمات سلبية</div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {stats.ratings_with_comments > 0 && (
                        <Badge variant="secondary">
                            {stats.ratings_with_comments} تعليق
                        </Badge>
                    )}
                    {stats.ratings_with_responses > 0 && (
                        <Badge variant="secondary">
                            {stats.ratings_with_responses} رد
                        </Badge>
                    )}
                    {stats.total_helpful_votes > 0 && (
                        <Badge variant="secondary">
                            {stats.total_helpful_votes} تصويت مفيد
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

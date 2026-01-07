import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRatings } from '@/hooks/useRatings';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { TripRating } from '@/types/rating';

interface RatingCardProps {
    rating: TripRating;
    onReport?: (ratingId: number) => void;
    showResponseButton?: boolean;
    onRespond?: (ratingId: number) => void;
}

export const RatingCard: React.FC<RatingCardProps> = ({
    rating,
    onReport,
    showResponseButton = false,
    onRespond,
}) => {
    const { markHelpful } = useRatings();
    const [userVote, setUserVote] = useState<boolean | null>(null);

    const handleHelpful = async (isHelpful: boolean) => {
        try {
            await markHelpful({
                rating_id: rating.rating_id,
                is_helpful: isHelpful,
            });
            setUserVote(isHelpful);
        } catch (error) {
            console.error('Error marking helpful:', error);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const timeAgo = formatDistanceToNow(new Date(rating.rating_date), {
        addSuffix: true,
        locale: ar,
    });

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(rating.user_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{rating.user_name}</p>
                            <p className="text-sm text-muted-foreground">{timeAgo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StarRating value={rating.stars} readonly size="sm" />
                        {rating.stars >= 4 && (
                            <Badge variant="default" className="bg-green-500">
                                ممتاز
                            </Badge>
                        )}
                        {rating.stars === 3 && (
                            <Badge variant="secondary">جيد</Badge>
                        )}
                        {rating.stars <= 2 && (
                            <Badge variant="destructive">يحتاج تحسين</Badge>
                        )}
                    </div>
                </div>

                {/* Detailed Ratings */}
                {(rating.service_rating || rating.cleanliness_rating || rating.punctuality_rating) && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            {rating.service_rating && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">الخدمة</span>
                                    <StarRating value={rating.service_rating} readonly size="sm" />
                                </div>
                            )}
                            {rating.cleanliness_rating && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">النظافة</span>
                                    <StarRating value={rating.cleanliness_rating} readonly size="sm" />
                                </div>
                            )}
                            {rating.punctuality_rating && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">المواعيد</span>
                                    <StarRating value={rating.punctuality_rating} readonly size="sm" />
                                </div>
                            )}
                            {rating.comfort_rating && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">الراحة</span>
                                    <StarRating value={rating.comfort_rating} readonly size="sm" />
                                </div>
                            )}
                            {rating.value_for_money_rating && (
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">القيمة</span>
                                    <StarRating value={rating.value_for_money_rating} readonly size="sm" />
                                </div>
                            )}
                        </div>
                        <Separator className="mb-4" />
                    </>
                )}

                {/* Comment */}
                {rating.comment && (
                    <p className="text-gray-700 mb-4 leading-relaxed">{rating.comment}</p>
                )}

                {/* Partner Response */}
                {rating.has_response && rating.response_text && (
                    <div className="bg-blue-50 border-r-4 border-blue-500 p-4 mb-4 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-900">رد الشريك</span>
                            {rating.response_date && (
                                <span className="text-xs text-blue-600">
                                    {formatDistanceToNow(new Date(rating.response_date), {
                                        addSuffix: true,
                                        locale: ar,
                                    })}
                                </span>
                            )}
                        </div>
                        <p className="text-blue-900 text-sm">{rating.response_text}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={userVote === true ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleHelpful(true)}
                            className="gap-1"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">مفيد ({rating.helpful_count})</span>
                        </Button>
                        <Button
                            variant={userVote === false ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleHelpful(false)}
                            className="gap-1"
                        >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-xs">غير مفيد ({rating.not_helpful_count})</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {showResponseButton && !rating.has_response && onRespond && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRespond(rating.rating_id)}
                                className="gap-1"
                            >
                                <MessageSquare className="w-4 h-4" />
                                رد
                            </Button>
                        )}
                        {onReport && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReport(rating.rating_id)}
                                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Flag className="w-4 h-4" />
                                إبلاغ
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

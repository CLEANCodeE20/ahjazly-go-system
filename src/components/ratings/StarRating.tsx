import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    readonly = false,
    size = 'md',
    showValue = false,
    className,
}) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    const handleClick = (rating: number) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating: number) => {
        if (!readonly) {
            setHoverValue(rating);
        }
    };

    const handleMouseLeave = () => {
        setHoverValue(null);
    };

    const displayValue = hoverValue ?? value;

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {[1, 2, 3, 4, 5].map((rating) => (
                <button
                    key={rating}
                    type="button"
                    onClick={() => handleClick(rating)}
                    onMouseEnter={() => handleMouseEnter(rating)}
                    onMouseLeave={handleMouseLeave}
                    disabled={readonly}
                    className={cn(
                        'transition-all',
                        !readonly && 'cursor-pointer hover:scale-110',
                        readonly && 'cursor-default'
                    )}
                >
                    <Star
                        className={cn(
                            sizeClasses[size],
                            'transition-colors',
                            rating <= displayValue
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                        )}
                    />
                </button>
            ))}
            {showValue && (
                <span className="mr-2 text-sm font-medium text-gray-700">
                    {value.toFixed(1)}
                </span>
            )}
        </div>
    );
};

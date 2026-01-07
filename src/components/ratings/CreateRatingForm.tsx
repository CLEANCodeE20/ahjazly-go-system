import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useRatings } from '@/hooks/useRatings';
import type { CreateRatingInput } from '@/types/rating';

const ratingFormSchema = z.object({
    stars: z.number().min(1, 'يرجى اختيار التقييم العام').max(5),
    service_rating: z.number().min(1).max(5).optional(),
    cleanliness_rating: z.number().min(1).max(5).optional(),
    punctuality_rating: z.number().min(1).max(5).optional(),
    comfort_rating: z.number().min(1).max(5).optional(),
    value_for_money_rating: z.number().min(1).max(5).optional(),
    comment: z.string().max(1000, 'التعليق يجب ألا يتجاوز 1000 حرف').optional(),
});

type RatingFormValues = z.infer<typeof ratingFormSchema>;

interface CreateRatingFormProps {
    tripId: number;
    bookingId: number;
    driverId?: number;
    partnerId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const CreateRatingForm: React.FC<CreateRatingFormProps> = ({
    tripId,
    bookingId,
    driverId,
    partnerId,
    onSuccess,
    onCancel,
}) => {
    const { createRating, loading } = useRatings();
    const [step, setStep] = useState<'overall' | 'detailed'>('overall');

    const form = useForm<RatingFormValues>({
        resolver: zodResolver(ratingFormSchema),
        defaultValues: {
            stars: 0,
            service_rating: 0,
            cleanliness_rating: 0,
            punctuality_rating: 0,
            comfort_rating: 0,
            value_for_money_rating: 0,
            comment: '',
        },
    });

    const onSubmit = async (values: RatingFormValues) => {
        try {
            const input: CreateRatingInput = {
                trip_id: tripId,
                booking_id: bookingId,
                driver_id: driverId,
                partner_id: partnerId,
                stars: values.stars,
                service_rating: values.service_rating || undefined,
                cleanliness_rating: values.cleanliness_rating || undefined,
                punctuality_rating: values.punctuality_rating || undefined,
                comfort_rating: values.comfort_rating || undefined,
                value_for_money_rating: values.value_for_money_rating || undefined,
                comment: values.comment || undefined,
            };

            await createRating(input);
            onSuccess?.();
        } catch (error) {
            console.error('Error creating rating:', error);
        }
    };

    const handleContinue = () => {
        if (form.getValues('stars') > 0) {
            setStep('detailed');
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>تقييم الرحلة</CardTitle>
                <CardDescription>
                    {step === 'overall'
                        ? 'ما هو تقييمك العام للرحلة؟'
                        : 'يرجى تقييم جوانب الرحلة المختلفة (اختياري)'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {step === 'overall' ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="stars"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center">
                                            <FormLabel className="text-lg mb-4">التقييم العام</FormLabel>
                                            <FormControl>
                                                <StarRating
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    size="lg"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="comment"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>التعليق (اختياري)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="شاركنا تجربتك مع هذه الرحلة..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3 justify-end">
                                    {onCancel && (
                                        <Button type="button" variant="outline" onClick={onCancel}>
                                            إلغاء
                                        </Button>
                                    )}
                                    <Button type="button" onClick={handleContinue}>
                                        متابعة للتفاصيل
                                    </Button>
                                    <Button type="submit" disabled={loading || form.getValues('stars') === 0}>
                                        {loading ? 'جاري الحفظ...' : 'حفظ التقييم'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="service_rating"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <FormLabel>جودة الخدمة</FormLabel>
                                                <FormControl>
                                                    <StarRating
                                                        value={field.value || 0}
                                                        onChange={field.onChange}
                                                        size="md"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="cleanliness_rating"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <FormLabel>النظافة</FormLabel>
                                                <FormControl>
                                                    <StarRating
                                                        value={field.value || 0}
                                                        onChange={field.onChange}
                                                        size="md"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="punctuality_rating"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <FormLabel>الالتزام بالمواعيد</FormLabel>
                                                <FormControl>
                                                    <StarRating
                                                        value={field.value || 0}
                                                        onChange={field.onChange}
                                                        size="md"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="comfort_rating"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <FormLabel>الراحة</FormLabel>
                                                <FormControl>
                                                    <StarRating
                                                        value={field.value || 0}
                                                        onChange={field.onChange}
                                                        size="md"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="value_for_money_rating"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <FormLabel>القيمة مقابل السعر</FormLabel>
                                                <FormControl>
                                                    <StarRating
                                                        value={field.value || 0}
                                                        onChange={field.onChange}
                                                        size="md"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button type="button" variant="outline" onClick={() => setStep('overall')}>
                                        رجوع
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'جاري الحفظ...' : 'حفظ التقييم'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ratings/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, TrendingUp, AlertTriangle, MessageSquare, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface RatingRequiringAttention {
    rating_id: number;
    trip_id: number;
    partner_name: string;
    user_name: string;
    stars: number;
    comment: string;
    rating_date: string;
    reported_count: number;
    has_response: boolean;
    days_since_rating: number;
}

/**
 * Ratings Management Page
 * Note: v_ratings_requiring_attention view doesn't exist yet.
 * Uses direct query to ratings table with simulated data.
 */
export const RatingsManagement: React.FC = () => {
    const [ratingsNeedingAttention, setRatingsNeedingAttention] = useState<RatingRequiringAttention[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [responseText, setResponseText] = useState('');
    const [showResponseDialog, setShowResponseDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchRatingsNeedingAttention();
    }, []);

    const fetchRatingsNeedingAttention = async () => {
        setLoading(true);
        try {
            // Query directly from ratings table instead of missing view
            const { data, error } = await supabase
                .from('ratings')
                .select(`
                    rating_id,
                    stars,
                    comment,
                    rating_date,
                    trip_id,
                    partner_id,
                    user_id,
                    users:user_id(full_name),
                    partners:partner_id(company_name)
                `)
                .lte('stars', 3)
                .order('rating_date', { ascending: false })
                .limit(50);

            if (error) throw error;
            
            // Transform data to expected format
            const transformedData: RatingRequiringAttention[] = (data || []).map((r: any) => ({
                rating_id: r.rating_id,
                trip_id: r.trip_id || 0,
                partner_name: r.partners?.company_name || 'غير محدد',
                user_name: r.users?.full_name || 'مستخدم',
                stars: r.stars || 0,
                comment: r.comment || '',
                rating_date: r.rating_date,
                reported_count: 0,
                has_response: false,
                days_since_rating: Math.floor((Date.now() - new Date(r.rating_date).getTime()) / (1000 * 60 * 60 * 24))
            }));
            
            setRatingsNeedingAttention(transformedData);
        } catch (error: any) {
            console.error('Error fetching ratings:', error);
            // Don't show error toast - just set empty array
            setRatingsNeedingAttention([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResponse = (ratingId: number) => {
        setSelectedRating(ratingId);
        setShowResponseDialog(true);
    };

    const submitResponse = async () => {
        if (!selectedRating || !responseText.trim()) return;

        try {
            const { data, error } = await supabase.functions.invoke('add-rating-response', {
                body: {
                    rating_id: selectedRating,
                    response_text: responseText.trim(),
                },
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: 'نجح',
                    description: 'تم إضافة الرد بنجاح',
                });
                setShowResponseDialog(false);
                setResponseText('');
                setSelectedRating(null);
                fetchRatingsNeedingAttention();
            } else {
                throw new Error(data?.error || 'فشل في إضافة الرد');
            }
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في إضافة الرد',
                variant: 'destructive',
            });
        }
    };

    const filteredRatings = ratingsNeedingAttention.filter(
        r =>
            r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">إدارة التقييمات</h1>
                    <p className="text-muted-foreground">
                        مراجعة ومتابعة تقييمات العملاء
                    </p>
                </div>
                <Button onClick={fetchRatingsNeedingAttention} disabled={loading}>
                    {loading ? 'جاري التحميل...' : 'تحديث'}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            تقييمات تحتاج متابعة
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ratingsNeedingAttention.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            تقييمات منخفضة (3 نجوم أو أقل)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            بدون رد
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ratingsNeedingAttention.filter(r => !r.has_response).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            تقييمات تحتاج رد من الشريك
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            مبلغ عنها
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ratingsNeedingAttention.filter(r => r.reported_count > 0).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            تقييمات تم الإبلاغ عنها
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="بحث في التقييمات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                    />
                </div>
            </div>

            {/* Ratings List */}
            <Card>
                <CardHeader>
                    <CardTitle>التقييمات المنخفضة</CardTitle>
                    <CardDescription>تقييمات تحتاج إلى متابعة ورد</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredRatings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">لا توجد تقييمات</h3>
                            <p className="text-muted-foreground">
                                لا توجد تقييمات منخفضة تحتاج إلى متابعة حالياً
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRatings.map(rating => (
                                <div key={rating.rating_id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{rating.user_name}</h3>
                                                <Badge variant="outline">{rating.partner_name}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                منذ {rating.days_since_rating} يوم
                                            </p>
                                        </div>
                                        <StarRating value={rating.stars} readonly size="sm" />
                                    </div>

                                    {rating.comment && (
                                        <p className="text-gray-700 mb-4">{rating.comment}</p>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddResponse(rating.rating_id)}
                                        >
                                            إضافة رد
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Response Dialog */}
            <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إضافة رد على التقييم</DialogTitle>
                        <DialogDescription>
                            اكتب ردك على تقييم العميل
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={submitResponse} disabled={!responseText.trim()}>
                            إرسال الرد
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RatingsManagement;

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ratings/StarRating';
import { RatingCard } from '@/components/ratings/RatingCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
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
            const { data, error } = await supabase
                .from('v_ratings_requiring_attention')
                .select('*')
                .limit(50);

            if (error) throw error;
            setRatingsNeedingAttention(data || []);
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في تحميل التقييمات',
                variant: 'destructive',
            });
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

    const handleHideRating = async (ratingId: number) => {
        try {
            const { error } = await supabase
                .from('ratings')
                .update({ is_visible: false })
                .eq('rating_id', ratingId);

            if (error) throw error;

            toast({
                title: 'نجح',
                description: 'تم إخفاء التقييم',
            });
            fetchRatingsNeedingAttention();
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في إخفاء التقييم',
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
                            تقييمات منخفضة أو مبلغ عنها
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
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">
                        الكل ({filteredRatings.length})
                    </TabsTrigger>
                    <TabsTrigger value="low">
                        منخفضة ({filteredRatings.filter(r => r.stars <= 2).length})
                    </TabsTrigger>
                    <TabsTrigger value="no-response">
                        بدون رد ({filteredRatings.filter(r => !r.has_response).length})
                    </TabsTrigger>
                    <TabsTrigger value="reported">
                        مبلغ عنها ({filteredRatings.filter(r => r.reported_count > 0).length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                    {filteredRatings.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">لا توجد تقييمات</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredRatings.map(rating => (
                            <Card key={rating.rating_id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{rating.user_name}</h3>
                                                <Badge variant="outline">{rating.partner_name}</Badge>
                                                {rating.reported_count > 0 && (
                                                    <Badge variant="destructive">
                                                        {rating.reported_count} بلاغ
                                                    </Badge>
                                                )}
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
                                        {!rating.has_response && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddResponse(rating.rating_id)}
                                            >
                                                إضافة رد
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleHideRating(rating.rating_id)}
                                        >
                                            إخفاء
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="low" className="space-y-4 mt-4">
                    {filteredRatings.filter(r => r.stars <= 2).map(rating => (
                        <Card key={rating.rating_id}>
                            <CardContent className="pt-6">
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
                                    {!rating.has_response && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddResponse(rating.rating_id)}
                                        >
                                            إضافة رد
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="no-response" className="space-y-4 mt-4">
                    {filteredRatings.filter(r => !r.has_response).map(rating => (
                        <Card key={rating.rating_id}>
                            <CardContent className="pt-6">
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

                                <Button
                                    size="sm"
                                    onClick={() => handleAddResponse(rating.rating_id)}
                                >
                                    إضافة رد
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="reported" className="space-y-4 mt-4">
                    {filteredRatings.filter(r => r.reported_count > 0).map(rating => (
                        <Card key={rating.rating_id} className="border-red-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">{rating.user_name}</h3>
                                            <Badge variant="outline">{rating.partner_name}</Badge>
                                            <Badge variant="destructive">
                                                {rating.reported_count} بلاغ
                                            </Badge>
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
                                        variant="destructive"
                                        onClick={() => handleHideRating(rating.rating_id)}
                                    >
                                        إخفاء التقييم
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Response Dialog */}
            <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إضافة رد على التقييم</DialogTitle>
                        <DialogDescription>
                            اكتب رداً مهذباً ومهنياً على تقييم العميل
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="اكتب ردك هنا..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="min-h-[150px]"
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowResponseDialog(false)}
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={submitResponse}
                            disabled={!responseText.trim() || responseText.length < 10}
                        >
                            إرسال الرد
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

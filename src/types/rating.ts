// =============================================
// RATING SYSTEM TYPES
// أنواع نظام التقييم
// =============================================

export interface Rating {
    rating_id: number;
    user_id: number;
    trip_id: number;
    booking_id: number;
    driver_id?: number;
    partner_id: number;
    stars: number;
    service_rating?: number;
    cleanliness_rating?: number;
    punctuality_rating?: number;
    comfort_rating?: number;
    value_for_money_rating?: number;
    comment?: string;
    is_verified: boolean;
    is_visible: boolean;
    admin_notes?: string;
    helpful_count: number;
    not_helpful_count: number;
    reported_count: number;
    rating_date: string;
    updated_at: string;
}

export interface RatingResponse {
    response_id: number;
    rating_id: number;
    partner_id: number;
    responder_user_id?: number;
    response_text: string;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

export interface RatingHelpfulness {
    id: number;
    rating_id: number;
    user_id: number;
    is_helpful: boolean;
    created_at: string;
}

export interface RatingReport {
    report_id: number;
    rating_id: number;
    reporter_user_id: number;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewed_by?: number;
    reviewed_at?: string;
    admin_notes?: string;
    created_at: string;
}

export interface CreateRatingInput {
    trip_id: number;
    booking_id: number;
    driver_id?: number;
    partner_id: number;
    stars: number;
    service_rating?: number;
    cleanliness_rating?: number;
    punctuality_rating?: number;
    comfort_rating?: number;
    value_for_money_rating?: number;
    comment?: string;
}

export interface UpdateRatingInput {
    rating_id: number;
    stars?: number;
    service_rating?: number;
    cleanliness_rating?: number;
    punctuality_rating?: number;
    comfort_rating?: number;
    value_for_money_rating?: number;
    comment?: string;
}

export interface CreateRatingResponseInput {
    rating_id: number;
    response_text: string;
}

export interface MarkRatingHelpfulInput {
    rating_id: number;
    is_helpful: boolean;
}

export interface ReportRatingInput {
    rating_id: number;
    reason: string;
    description?: string;
}

export interface PartnerRatingStats {
    partner_id: number;
    company_name: string;
    partner_status: string;
    total_ratings: number;
    avg_overall_rating: number;
    avg_service_rating: number;
    avg_cleanliness_rating: number;
    avg_punctuality_rating: number;
    avg_comfort_rating: number;
    avg_value_rating: number;
    five_star_count: number;
    four_star_count: number;
    three_star_count: number;
    two_star_count: number;
    one_star_count: number;
    positive_ratings: number;
    negative_ratings: number;
    positive_percentage: number;
    negative_percentage: number;
    ratings_with_comments: number;
    total_helpful_votes: number;
    ratings_with_responses: number;
    last_rating_date?: string;
}

export interface DriverRatingStats {
    driver_id: number;
    driver_name: string;
    partner_id: number;
    partner_name: string;
    driver_status: string;
    total_ratings: number;
    avg_rating: number;
    positive_ratings: number;
    negative_ratings: number;
    positive_percentage: number;
    last_rating_date?: string;
}

export interface RatingWithDetails extends Rating {
    user_name: string;
    partner_name: string;
    driver_name?: string;
    route: string;
    has_response: boolean;
    response_text?: string;
    response_date?: string;
}

export interface TripRating {
    rating_id: number;
    user_name: string;
    stars: number;
    service_rating?: number;
    cleanliness_rating?: number;
    punctuality_rating?: number;
    comfort_rating?: number;
    value_for_money_rating?: number;
    comment?: string;
    rating_date: string;
    helpful_count: number;
    not_helpful_count: number;
    has_response: boolean;
    response_text?: string;
    response_date?: string;
}

export interface RatingRequiringAttention {
    rating_id: number;
    trip_id: number;
    partner_name: string;
    user_name: string;
    stars: number;
    comment?: string;
    rating_date: string;
    reported_count: number;
    has_response: boolean;
    days_since_rating: number;
}

import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/rating_model.dart';

// =============================================
// RATING SERVICE
// خدمة التقييمات
// =============================================

class RatingService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // =============================================
  // التحقق من أهلية المستخدم للتقييم
  // =============================================
  Future<bool> canUserRateTrip({
    required int userId,
    required int tripId,
    required int bookingId,
  }) async {
    try {
      final response = await _supabase.rpc(
        'check_rating_eligibility', // Original RPC name
        params: {
          'p_auth_id': _supabase.auth.currentUser?.id, // Updated to p_auth_id
          'p_trip_id': tripId,
          'p_booking_id': bookingId,
        },
      );
      return response as bool? ?? false;
    } catch (e) {
      print('Error checking rating eligibility: $e');
      return false;
    }
  }

  // =============================================
  // إنشاء تقييم جديد
  // =============================================
  Future<Rating?> createRating(CreateRatingInput input) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('User not authenticated');

      final ratingId = await _supabase.rpc(
        'submit_trip_rating', // Original RPC name
        params: {
          'p_auth_id': userId, // Updated to p_auth_id
          'p_trip_id': input.tripId,
          'p_booking_id': input.bookingId,
          'p_driver_id': input.driverId,
          'p_partner_id': input.partnerId,
          'p_stars': input.stars,
          'p_service_rating': input.serviceRating,
          'p_cleanliness_rating': input.cleanlinessRating,
          'p_punctuality_rating': input.punctualityRating,
          'p_comfort_rating': input.comfortRating,
          'p_value_for_money_rating': input.valueForMoneyRating,
          'p_comment': input.comment,
        },
      );

      // Fetch the created rating to return it
      final response = await _supabase
          .from('ratings')
          .select()
          .eq('rating_id', ratingId)
          .single();
          
      return Rating.fromJson(response);
    } catch (e) {
      print('Error creating rating: $e');
      rethrow;
    }
  }

  // =============================================
  // الحصول على تقييمات رحلة
  // =============================================
  Future<List<TripRating>> getTripRatings({
    required int tripId,
    int limit = 10,
    int offset = 0,
  }) async {
    try {
      final response = await _supabase.rpc(
        'get_trip_ratings',
        params: {
          'p_trip_id': tripId,
          'p_limit': limit,
          'p_offset': offset,
        },
      );

      if (response == null) return [];

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => TripRating.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching trip ratings: $e');
      return [];
    }
  }

  // =============================================
  // الحصول على إحصائيات الشريك
  // =============================================
  Future<PartnerRatingStats?> getPartnerStats(int partnerId) async {
    try {
      final response = await _supabase.rpc(
        'get_partner_rating_stats',
        params: {'p_partner_id': partnerId},
      );

      if (response == null || (response as List).isEmpty) return null;

      return PartnerRatingStats.fromJson((response as List).first);
    } catch (e) {
      print('Error fetching partner stats: $e');
      return null;
    }
  }

  // =============================================
  // تحديث تقييم
  // =============================================
  Future<Rating?> updateRating({
    required int ratingId,
    int? stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (stars != null) updates['stars'] = stars;
      if (serviceRating != null) updates['service_rating'] = serviceRating;
      if (cleanlinessRating != null) {
        updates['cleanliness_rating'] = cleanlinessRating;
      }
      if (punctualityRating != null) {
        updates['punctuality_rating'] = punctualityRating;
      }
      if (comfortRating != null) updates['comfort_rating'] = comfortRating;
      if (valueForMoneyRating != null) {
        updates['value_for_money_rating'] = valueForMoneyRating;
      }
      if (comment != null) updates['comment'] = comment;

      final response = await _supabase
          .from('ratings')
          .update(updates)
          .eq('rating_id', ratingId)
          .select()
          .single();

      return Rating.fromJson(response);
    } catch (e) {
      print('Error updating rating: $e');
      rethrow;
    }
  }

  // =============================================
  // تقييم مدى فائدة التقييم
  // =============================================
  Future<Map<String, dynamic>?> markRatingHelpful({
    required int ratingId,
    required bool isHelpful,
  }) async {
    try {
      final response = await _supabase.rpc(
        'mark_rating_helpful',
        params: {
          'p_rating_id': ratingId,
          'p_is_helpful': isHelpful,
        },
      );

      return response as Map<String, dynamic>?;
    } catch (e) {
      print('Error marking rating helpful: $e');
      rethrow;
    }
  }

  // =============================================
  // الإبلاغ عن تقييم
  // =============================================
  Future<bool> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  }) async {
    try {
      final response = await _supabase.rpc(
        'report_rating',
        params: {
          'p_rating_id': ratingId,
          'p_reason': reason,
          'p_description': description,
        },
      );

      return response != null && response['success'] == true;
    } catch (e) {
      print('Error reporting rating: $e');
      rethrow;
    }
  }

  // =============================================
  // إضافة رد من الشريك
  // =============================================
  Future<bool> addPartnerResponse({
    required int ratingId,
    required String responseText,
  }) async {
    try {
      final response = await _supabase.rpc(
        'add_rating_response',
        params: {
          'p_rating_id': ratingId,
          'p_response_text': responseText,
        },
      );

      return response != null && response['success'] == true;
    } catch (e) {
      print('Error adding partner response: $e');
      rethrow;
    }
  }

  // =============================================
  // الحصول على متوسط تقييم الشريك
  // =============================================
  Future<double> getPartnerAverageRating(int partnerId) async {
    try {
      final response = await _supabase.rpc(
        'get_partner_average_rating',
        params: {'p_partner_id': partnerId},
      );

      return (response as num?)?.toDouble() ?? 0.0;
    } catch (e) {
      print('Error fetching partner average rating: $e');
      return 0.0;
    }
  }

  // =============================================
  // الحصول على متوسط تقييم السائق
  // =============================================
  Future<double> getDriverAverageRating(int driverId) async {
    try {
      final response = await _supabase.rpc(
        'get_driver_average_rating',
        params: {'p_driver_id': driverId},
      );

      return (response as num?)?.toDouble() ?? 0.0;
    } catch (e) {
      print('Error fetching driver average rating: $e');
      return 0.0;
    }
  }
}

import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/bus_trip_model.dart';
import '../../../../core/error/exceptions.dart';

abstract class TripsRemoteDataSource {
  Future<List<BusTripModel>> searchTrips({
    required String fromCity,
    required String toCity,
    required String date,
    String? busClass,
  });

  Future<Map<String, dynamic>> submitRating({
    required int tripId,
    required int bookingId,
    required int partnerId,
    int? driverId,
    required int stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  });

  Future<List<dynamic>> getTripRatings({
    required int tripId,
    int limit = 10,
    int offset = 0,
  });

  Future<Map<String, dynamic>?> getPartnerStats(int partnerId);

  Future<Map<String, dynamic>?> markRatingHelpful({
    required int ratingId,
    required bool isHelpful,
  });

  Future<bool> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  });

  Future<bool> canUserRateTrip({
    required int userId,
    required int tripId,
    required int bookingId,
  });

  Future<Map<String, dynamic>> updateRating({
    required int ratingId,
    int? stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  });

  Future<bool> addPartnerResponse({
    required int ratingId,
    required String responseText,
  });

  Future<double> getPartnerAverageRating(int partnerId);

  Future<double> getDriverAverageRating(int driverId);
}

class TripsRemoteDataSourceImpl implements TripsRemoteDataSource {
  final SupabaseClient client;

  TripsRemoteDataSourceImpl(this.client);

  @override
  Future<List<BusTripModel>> searchTrips({
    required String fromCity,
    required String toCity,
    required String date,
    String? busClass,
  }) async {
    try {
      final response = await client.rpc('search_trips', params: {
        '_from_stop': fromCity, 
        '_to_city': toCity,
        '_date': date,
        '_bus_class': busClass ?? '' 
      });

      final List<dynamic> results = response as List<dynamic>;
      return results.map((json) => BusTripModel.fromJson(json)).toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> submitRating({
    required int tripId,
    required int bookingId,
    required int partnerId,
    int? driverId,
    required int stars,
    int? serviceRating,
    int? cleanlinessRating,
    int? punctualityRating,
    int? comfortRating,
    int? valueForMoneyRating,
    String? comment,
  }) async {
    try {
      final userId = client.auth.currentUser?.id;
      if (userId == null) throw ServerException('User not authenticated');

      final ratingId = await client.rpc(
        'create_rating', // Updated to use the new RPC
        params: {
          'p_auth_id': userId, // Updated parameter name to p_auth_id
          'p_trip_id': tripId,
          'p_booking_id': bookingId,
          'p_driver_id': driverId,
          'p_partner_id': partnerId,
          'p_stars': stars,
          'p_service_rating': serviceRating,
          'p_cleanliness_rating': cleanlinessRating,
          'p_punctuality_rating': punctualityRating,
          'p_comfort_rating': comfortRating,
          'p_value_for_money_rating': valueForMoneyRating,
          'p_comment': comment,
        },
      );

      final response = await client
          .from('ratings')
          .select()
          .eq('rating_id', ratingId)
          .single();

      return response;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<dynamic>> getTripRatings({
    required int tripId,
    int limit = 10,
    int offset = 0,
  }) async {
    try {
      final response = await client.rpc(
        'get_trip_ratings',
        params: {
          'p_trip_id': tripId,
          'p_limit': limit,
          'p_offset': offset,
        },
      );

      if (response == null) return [];
      return response as List<dynamic>;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>?> getPartnerStats(int partnerId) async {
    try {
      final response = await client.rpc(
        'get_partner_rating_stats',
        params: {'p_partner_id': partnerId},
      );

      if (response == null || (response as List).isEmpty) return null;
      return (response as List).first as Map<String, dynamic>;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>?> markRatingHelpful({
    required int ratingId,
    required bool isHelpful,
  }) async {
    try {
      final response = await client.rpc(
        'mark_rating_helpful',
        params: {
          'p_rating_id': ratingId,
          'p_is_helpful': isHelpful,
        },
      );
      return response as Map<String, dynamic>?;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<bool> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  }) async {
    try {
      final response = await client.rpc(
        'report_rating',
        params: {
          'p_rating_id': ratingId,
          'p_reason': reason,
          'p_description': description,
        },
      );
      return response != null && response['success'] == true;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<bool> canUserRateTrip({
    required int userId,
    required int tripId,
    required int bookingId,
  }) async {
    try {
      final response = await client.rpc(
        'check_rating_eligibility',
        params: {
          'p_user_id': client.auth.currentUser?.id,
          'p_trip_id': tripId,
          'p_booking_id': bookingId,
        },
      );
      return response as bool? ?? false;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> updateRating({
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

      final response = await client
          .from('ratings')
          .update(updates)
          .eq('rating_id', ratingId)
          .select()
          .single();

      return response;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<bool> addPartnerResponse({
    required int ratingId,
    required String responseText,
  }) async {
    try {
      final response = await client.rpc(
        'add_rating_response',
        params: {
          'p_rating_id': ratingId,
          'p_response_text': responseText,
        },
      );
      return response != null && response['success'] == true;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<double> getPartnerAverageRating(int partnerId) async {
    try {
      final response = await client.rpc(
        'get_partner_average_rating',
        params: {'p_partner_id': partnerId},
      );
      return (response as num?)?.toDouble() ?? 0.0;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<double> getDriverAverageRating(int driverId) async {
    try {
      final response = await client.rpc(
        'get_driver_average_rating',
        params: {'p_driver_id': driverId},
      );
      return (response as num?)?.toDouble() ?? 0.0;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}

import 'package:supabase_flutter/supabase_flutter.dart';

// =============================================
// ENHANCED TRIP BOOKING SERVICE
// خدمة الحجز المحسّنة
// =============================================

class EnhancedBookingService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // =============================================
  // التحقق من إمكانية الحجز
  // =============================================
  Future<Map<String, dynamic>> canBookTrip(int tripId) async {
    try {
      final response = await _supabase.rpc(
        'can_book_trip',
        params: {'p_trip_id': tripId},
      );

      return {
        'canBook': response['can_book'] as bool,
        'reason': response['reason'] as String?,
        'message': response['message'] as String,
        'availableSeats': response['available_seats'] as int?,
        'timeUntilDeparture': response['time_until_departure'] as double?,
        'tripStatus': response['trip_status'] as String?,
      };
    } catch (e) {
      print('Error checking booking eligibility: $e');
      return {
        'canBook': false,
        'message': 'فشل في التحقق من إمكانية الحجز',
      };
    }
  }

  // =============================================
  // الحصول على الرحلات المتاحة
  // =============================================
  Future<List<Map<String, dynamic>>> getAvailableTrips() async {
    try {
      final response = await _supabase
          .from('v_available_trips')
          .select()
          .order('departure_time', ascending: true);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching available trips: $e');
      return [];
    }
  }

  // =============================================
  // إلغاء الرحلات المنتهية
  // =============================================
  Future<int> cancelExpiredTrips() async {
    try {
      final response = await _supabase.rpc('auto_cancel_expired_trips');
      return response as int? ?? 0;
    } catch (e) {
      print('Error cancelling expired trips: $e');
      return 0;
    }
  }

  // =============================================
  // التحقق من حالة الرحلة
  // =============================================
  Future<String?> getTripStatus(int tripId) async {
    try {
      final response = await _supabase
          .from('trips')
          .select('status')
          .eq('trip_id', tripId)
          .single();

      return response['status'] as String?;
    } catch (e) {
      print('Error fetching trip status: $e');
      return null;
    }
  }

  // =============================================
  // الاشتراك في تحديثات حالة الرحلة
  // =============================================
  Stream<String?> subscribeTripStatus(int tripId) {
    return _supabase
        .from('trips:trip_id=eq.$tripId')
        .stream(primaryKey: ['trip_id'])
        .map((data) {
          if (data.isEmpty) return null;
          return data.first['status'] as String?;
        });
  }

  // =============================================
  // الاشتراك في تحديثات الحجوزات المكتملة
  // =============================================
  Stream<List<Map<String, dynamic>>> subscribeCompletedBookings(int userId) {
    return _supabase
        .from('bookings:user_id=eq.$userId,booking_status=eq.completed')
        .stream(primaryKey: ['booking_id'])
        .map((data) => List<Map<String, dynamic>>.from(data));
  }
}

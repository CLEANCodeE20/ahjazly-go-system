import 'dart:typed_data';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase/supabase_service.dart';
import '../trips/data/models/user_booking_model.dart';

class SupabaseBookingService extends GetxService {
  final SupabaseClient _client = SupabaseService.to;

  /// Fetch bookings for a specific user directly from Supabase.
  /// This bypasses the PHP backend and uses the native SDK.
  Future<List<UserBooking>> fetchUserBookings(String authId) async {
    try {
      // Note: We use the join syntax to get trip and route details in one go.
      // This assumes the RLS policies allowed for 'bookings' and related tables.
      final response = await _client
          .from('bookings')
          .select('''
            booking_id,
            booking_status,
            payment_status,
            payment_method,
            total_price,
            refund_amount,
            cancellation_fee,
            booking_date,
            trips (
              trip_id,
              departure_time,
              arrival_time,
              base_price,
              base_price,
              partner_id,
              driver_id,
              routes (
                origin_city,
                destination_city
              ),
              partners (
                company_name
              ),
              buses (
                bus_classes (
                  class_name
                )
              )
            ),
            ratings (
              rating_id
            ),
            users!inner (
               user_id,
               full_name
            ),
            passengers (
              full_name,
              phone_number,
              seats (
                seat_number
              )
            )
          ''')
          .eq('users.auth_id', authId)
          .order('booking_date', ascending: false);

      List<UserBooking> bookingsList = [];
      
      for (var json in (response as List)) {
        final trip = json['trips'];
        final route = trip['routes'];
        final partner = trip['partners'];
        final busClass = trip['buses']['bus_classes']['class_name'];
        final user = json['users'];
        // Handle passengers (List or Map depending on Supabase inference)
        var passengersRaw = json['passengers'];
        List passengers;
        if (passengersRaw is List) {
          passengers = passengersRaw;
        } else if (passengersRaw != null) {
          passengers = [passengersRaw];
        } else {
          passengers = [];
        }

        if (passengers.isEmpty) {
             // Fallback if no passengers for some reason (should not happen with regular bookings)
             bookingsList.add(UserBooking(
              userId: user['auth_id']?.toString() ?? '', // Updated to auth_id
              fullName: user['full_name'], // Account name as fallback
              bookingId: json['booking_id'],
              bookingStatus: json['booking_status'],
              tripId: trip['trip_id'],
              departureTime: DateTime.parse(trip['departure_time']),
              arrivalTime: DateTime.parse(trip['arrival_time']),
              originCity: route['origin_city'],
              destinationCity: route['destination_city'],
              busClass: busClass,
              companyName: partner['company_name'],
              basePrice: (json['total_price'] as num).toDouble(),
              paymentStatus: json['payment_status'] ?? 'Unpaid',
              paymentMethod: json['payment_method'],
              refundAmount: json['refund_amount'] != null ? (json['refund_amount'] as num).toDouble() : null,
              cancellationFee: json['cancellation_fee'] != null ? (json['cancellation_fee'] as num).toDouble() : null,
              partnerId: trip['partner_id'] != null ? (trip['partner_id'] as int) : null,
              driverId: trip['driver_id'] != null ? (trip['driver_id'] as int) : null,
              hasRating: json['ratings'] != null && (json['ratings'] is List ? (json['ratings'] as List).isNotEmpty : true),
            ));
        } else {
            for (var p in passengers) {
                final seat = p['seats'];
                bookingsList.add(UserBooking(
                  userId: user['auth_id']?.toString() ?? '', // Updated to auth_id
                  fullName: user['full_name'], // Still keep account name
                  passengerName: p['full_name'],
                  passengerPhone: p['phone_number'],
                  seatNumber: seat != null ? seat['seat_number']?.toString() : null,
                  bookingId: json['booking_id'],
                  bookingStatus: json['booking_status'],
                  tripId: trip['trip_id'],
                  departureTime: DateTime.parse(trip['departure_time']),
                  arrivalTime: DateTime.parse(trip['arrival_time']),
                  originCity: route['origin_city'],
                  destinationCity: route['destination_city'],
                  busClass: busClass,
                  companyName: partner['company_name'],
                  basePrice: (json['total_price'] as num).toDouble(),
                  paymentStatus: json['payment_status'] ?? 'Unpaid',
                  paymentMethod: json['payment_method'],
                  refundAmount: json['refund_amount'] != null ? (json['refund_amount'] as num).toDouble() : null,
                  cancellationFee: json['cancellation_fee'] != null ? (json['cancellation_fee'] as num).toDouble() : null,
                  partnerId: trip['partner_id'] != null ? (trip['partner_id'] as int) : null,
                  driverId: trip['driver_id'] != null ? (trip['driver_id'] as int) : null,
                  hasRating: json['ratings'] != null && (json['ratings'] is List ? (json['ratings'] as List).isNotEmpty : true),
                ));
            }
        }
      }
      return bookingsList;
    } catch (e) {
      print('Supabase Fetch Error: $e');
      rethrow;
    }
  }

  /// Real-time stream for a user's bookings.
  Stream<List<Map<String, dynamic>>> subscribeToBookings(String userId) {
    return _client
        .from('bookings')
        .stream(primaryKey: ['booking_id'])
        .eq('auth_id', userId)
        .order('booking_date');
  }

  Future<Map<String, dynamic>> cancelBooking(int bookingId, {String? reason, bool confirm = false}) async {
    final response = await _client.rpc('cancel_booking_rpc', params: {
      'p_booking_id': bookingId,
      'p_reason': reason ?? 'Cancelled by user',
      'p_confirm': confirm
    });
    return Map<String, dynamic>.from(response as Map);
  }

  Future<Map<String, dynamic>> createBooking({
    required String userId,
    required int tripId,
    required double totalPrice,
    required String paymentMethod,
    required List<Map<String, dynamic>> passengers,
  }) async {
    final response = await _client.rpc('create_booking_v3', params: {
      'p_auth_id': userId,
      'p_trip_id': tripId,
      'p_payment_method': paymentMethod.toLowerCase(),
      'p_passengers_json': passengers,
    });
    return Map<String, dynamic>.from(response as Map);
  }

  Future<Map<String, dynamic>> updatePaymentStatus({
    required int bookingId,
    required String status,
    required String method,
    String? transactionId,
  }) async {
    final response = await _client.rpc('update_payment_v2', params: {
      'p_booking_id': bookingId,
      'p_payment_status': status.toLowerCase(),
      'p_payment_method': method.toLowerCase(),
      'p_transaction_id': transactionId,
    });
    return Map<String, dynamic>.from(response as Map);
  }

  Future<Map<String, dynamic>> getAvailableSeats(int tripId) async {
    final response = await _client.rpc('get_available_seats', params: {
      'p_trip_id': tripId,
    });
    return Map<String, dynamic>.from(response as Map);
  }

  /// Upload an ID image to Supabase Storage and return the public URL
  Future<String?> uploadIdImage(String path, List<int> bytes) async {
    try {
      final String fileName = '${DateTime.now().millisecondsSinceEpoch}_${path.split('/').last}';
      final String fullPath = 'passenger_ids/$fileName';

      await _client.storage.from('passenger-ids').uploadBinary(
        fullPath,
        Uint8List.fromList(bytes),
        fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
      );

      final String publicUrl = _client.storage.from('passenger-ids').getPublicUrl(fullPath);
      return publicUrl;
    } catch (e) {
      print('Supabase Upload Error: $e');
      return null;
    }
  }
}

import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/booking_model.dart';

import '../../../../core/error/exceptions.dart';

abstract class BookingRemoteDataSource {
  Future<List<BookingModel>> getUserBookings(String authId);
  Future<Map<String, dynamic>> cancelBooking(int bookingId, {String? reason, bool confirm = false});
  Future<BookingModel> createBooking(Map<String, dynamic> bookingData);
  Future<void> updatePaymentStatus({
    required int bookingId,
    required String status,
    required String method,
    String? transactionId,
  });
  Future<Map<String, dynamic>> getAvailableSeats(int tripId);
  Future<String?> uploadIdImage(String fileName, List<int> bytes);
}

class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final SupabaseClient client;

  BookingRemoteDataSourceImpl(this.client);

  @override
  Future<String?> uploadIdImage(String fileName, List<int> bytes) async {
    try {
      final String path = 'passenger_ids/$fileName';
      await client.storage.from('passenger-ids').uploadBinary(
        path,
        Uint8List.fromList(bytes),
        fileOptions: const FileOptions(cacheControl: '3600', upsert: true),
      );
      
      return client.storage.from('passenger-ids').getPublicUrl(path);
    } catch (e) {
      print('Error uploading ID image: $e');
      return null;
    }
  }

  @override
  Future<List<BookingModel>> getUserBookings(String authId) async {
    try {
      final response = await client.from('booking_details_view').select().eq('auth_id', authId);
      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => BookingModel.fromJson(json)).toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> cancelBooking(int bookingId, {String? reason, bool confirm = false}) async {
    try {
      final response = await client.rpc('cancel_booking_rpc', params: {
        'p_booking_id': bookingId,
        'p_reason': reason ?? 'Customer requested cancellation',
        'p_confirm': confirm
      });
      return Map<String, dynamic>.from(response);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<BookingModel> createBooking(Map<String, dynamic> bookingData) async {
     try {
       final response = await client.rpc('create_booking_v3', params: {
         'p_auth_id': bookingData['auth_id'], // Corrected key to match CreateBookingParams
         'p_trip_id': bookingData['trip_id'],
         'p_payment_method': (bookingData['payment_method'] as String).toLowerCase(),
         'p_passengers_json': bookingData['passengers'],
       });

       final result = Map<String, dynamic>.from(response);
       if (result['success'] == false) {
         throw ServerException(result['message'] ?? 'Failed to create booking');
       }

       final bookingId = result['booking_id'];
       
       // Fetch the fully populated booking details from the view for consistency
       final fullData = await client.from('booking_details_view').select().eq('booking_id', bookingId).limit(1).maybeSingle();
       
       if (fullData == null) {
         throw ServerException('Booking created but details not found');
       }

       return BookingModel.fromJson(fullData);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> updatePaymentStatus({
    required int bookingId,
    required String status,
    required String method,
    String? transactionId,
  }) async {
    try {
      await client.rpc('update_booking_payment', params: {
        'p_booking_id': bookingId,
        'p_status': status.toLowerCase(),
        'p_method': method.toLowerCase(),
        'p_transaction_id': transactionId,
      });
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> getAvailableSeats(int tripId) async {
    try {
      final response = await client.rpc('get_available_seats', params: {'p_trip_id': tripId});
      return Map<String, dynamic>.from(response);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}

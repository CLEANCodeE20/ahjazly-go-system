import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/driver_model.dart';
import '../models/driver_trip_model.dart';
import '../models/trip_passenger_model.dart';
import '../models/driver_settings_model.dart';
import '../models/driver_stats_model.dart';
import '../models/driver_document_model.dart';
import '../../../../core/error/exceptions.dart';

abstract class DriverRemoteDataSource {
  Future<DriverModel> getDriverByAuthId(String authId);
  Future<DriverSettingsModel> getDriverSettings(int driverId);
  Future<void> updateDriverSettings(int driverId, Map<String, dynamic> settings);
  Future<List<DriverTripModel>> getDriverTrips({
    required DateTime startDate,
    required DateTime endDate,
    String? status,
  });
  Future<List<TripPassengerModel>> getTripPassengers(int tripId);
  Future<Map<String, dynamic>> updateTripStatus({
    required int tripId,
    required String newStatus,
    double? locationLat,
    double? locationLng,
    String? notes,
  });
  Future<Map<String, dynamic>> logPassengerBoarding({
    required int passengerId,
    required int tripId,
    String boardingMethod = 'manual',
    double? locationLat,
    double? locationLng,
    String? notes,
  });
  Future<DriverStatsModel> getDriverStats(int driverId);
  Future<List<DriverDocumentModel>> getDriverDocuments(int driverId);
  Future<DriverDocumentModel> uploadDocument({
    required int driverId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? expiryDate,
  });
}

class DriverRemoteDataSourceImpl implements DriverRemoteDataSource {
  final SupabaseClient client;

  DriverRemoteDataSourceImpl(this.client);

  @override
  Future<DriverModel> getDriverByAuthId(String authId) async {
    try {
      final response = await client
          .from('drivers')
          .select()
          .eq('auth_id', authId)
          .single();
      return DriverModel.fromJson(response);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<DriverSettingsModel> getDriverSettings(int driverId) async {
    try {
      final response = await client
          .from('driver_settings')
          .select()
          .eq('driver_id', driverId)
          .maybeSingle();
      return DriverSettingsModel.fromJson(response ?? {'driver_id': driverId});
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> updateDriverSettings(int driverId, Map<String, dynamic> settings) async {
    try {
      await client
          .from('driver_settings')
          .update(settings)
          .eq('driver_id', driverId);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<DriverTripModel>> getDriverTrips({
    required DateTime startDate,
    required DateTime endDate,
    String? status,
  }) async {
    try {
      final response = await client.rpc('get_driver_trips', params: {
        'p_start_date': startDate.toIso8601String().split('T')[0],
        'p_end_date': endDate.toIso8601String().split('T')[0],
        'p_status': status,
      });

      if (response == null) return [];

      return (response as List)
          .map((json) => DriverTripModel.fromJson(json))
          .toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<TripPassengerModel>> getTripPassengers(int tripId) async {
    try {
      final response = await client
          .from('passengers')
          .select()
          .eq('trip_id', tripId)
          .order('seat_id');

      return (response as List)
          .map((json) => TripPassengerModel.fromJson(json))
          .toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> updateTripStatus({
    required int tripId,
    required String newStatus,
    double? locationLat,
    double? locationLng,
    String? notes,
  }) async {
    try {
      final response = await client.rpc('update_trip_status_by_driver', params: {
        'p_trip_id': tripId,
        'p_new_status': newStatus,
        'p_location_lat': locationLat,
        'p_location_lng': locationLng,
        'p_notes': notes,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> logPassengerBoarding({
    required int passengerId,
    required int tripId,
    String boardingMethod = 'manual',
    double? locationLat,
    double? locationLng,
    String? notes,
  }) async {
    try {
      final response = await client.rpc('log_passenger_boarding', params: {
        'p_passenger_id': passengerId,
        'p_trip_id': tripId,
        'p_boarding_method': boardingMethod,
        'p_location_lat': locationLat,
        'p_location_lng': locationLng,
        'p_notes': notes,
      });
      return response as Map<String, dynamic>;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<DriverStatsModel> getDriverStats(int driverId) async {
    try {
       final results = await Future.wait([
        client.from('trips').count(CountOption.exact).eq('driver_id', driverId).then((value) => value),
        client.from('trips').count(CountOption.exact).eq('driver_id', driverId).eq('status', 'completed').then((value) => value),
        client.from('bookings').select('trips!inner(driver_id)').eq('trips.driver_id', driverId).count(CountOption.exact).then((value) => value),
      ]);

      return DriverStatsModel(
        totalTrips: results[0] as int,
        completedTrips: results[1] as int,
        totalPassengers: results[2] as int,
      );
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<List<DriverDocumentModel>> getDriverDocuments(int driverId) async {
    try {
      final response = await client
          .from('driver_documents')
          .select()
          .eq('driver_id', driverId)
          .order('created_at', ascending: false);
      return (response as List).map((json) => DriverDocumentModel.fromJson(json)).toList();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<DriverDocumentModel> uploadDocument({
    required int driverId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? expiryDate,
  }) async {
    try {
      final file = File(filePath);
      final storagePath = 'drivers/$driverId/$fileName';

      await client.storage.from('driver-documents').upload(
            storagePath,
            file,
            fileOptions: const FileOptions(upsert: true),
          );

      final String publicUrl = client.storage
          .from('driver-documents')
          .getPublicUrl(storagePath);

      final response = await client.from('driver_documents').insert({
        'driver_id': driverId,
        'document_type': documentType,
        'document_url': publicUrl,
        'document_name': fileName,
        'expiry_date': expiryDate,
        'verification_status': 'pending',
      }).select().single();

      return DriverDocumentModel.fromJson(response);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}

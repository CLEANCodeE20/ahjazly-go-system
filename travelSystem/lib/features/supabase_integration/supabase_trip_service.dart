import 'dart:convert';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/services/cache_service.dart';
import '../../core/constants/app_constants.dart';

class SupabaseTripService extends GetxService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final CacheService _cacheService = Get.find<CacheService>();

  Future<List<Map<String, dynamic>>> searchTrips({
    required String fromCity,
    required String toCity,
    required String tripType,
    required String date,
    int page = 1,
    int limit = 20,
  }) async {
    // Generate cache key including pagination
    final cacheKey = 'trips_${fromCity}_${toCity}_${tripType}_${date}_${page}_$limit';
    
    // Check cache first
    final cachedTrips = _cacheService.readList<Map<String, dynamic>>(cacheKey);
    if (cachedTrips != null) {
      return cachedTrips.map((e) => Map<String, dynamic>.from(e)).toList();
    }

    // Map UI trip types to DB values
    String dbTripType = tripType;
    if (tripType.toLowerCase() == 'vip') {
      dbTripType = 'VIP';
    } else if (tripType == 'عادي') {
      dbTripType = 'Standard';
    }

    try {
      final response = await _supabase
          .rpc('search_trips', params: {
            '_from_stop': fromCity, 
            '_to_city': toCity,
            '_date': date,
            '_bus_class': dbTripType 
          });

      // The RPC returns a List<dynamic> which is a list of maps
      final results = List<Map<String, dynamic>>.from(response);
      
      // Save to cache
      if (results.isNotEmpty) {
        await _cacheService.saveList(
          cacheKey, 
          results, 
          expiration: AppConstants.tripsCacheExpiration
        );
      }
      
      return results;
    } catch (e) {
      print('Supabase Trip Search Error: $e');
      rethrow;
    }
  }
}

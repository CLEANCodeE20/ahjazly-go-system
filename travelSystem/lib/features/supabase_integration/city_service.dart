import 'package:supabase_flutter/supabase_flutter.dart';
import '../trips/data/models/city_model.dart';
import 'package:get/get.dart';

class CityService extends GetxService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final RxList<City> cities = <City>[].obs;
  final RxBool isLoading = false.obs;

  Future<CityService> init() async {
    await fetchCities();
    return this;
  }

  Future<void> fetchCities() async {
    try {
      isLoading.value = true;
      print('🏙️ Fetching cities...');
      final response = await _supabase
          .from('cities')
          .select()
          .eq('is_active', true)
          .order('name_ar')
          .timeout(const Duration(seconds: 5));

      if (response != null) {
        cities.value = (response as List)
            .map((json) => City.fromJson(json))
            .toList();
        print('✅ Fetched ${cities.length} cities.');
      }
    } catch (e) {
      print('❌ Error fetching cities or timed out: $e');
      // Keep existing list or default to empty
    } finally {
      isLoading.value = false;
    }
  }

  List<String> getCityNames() {
    return cities.map((c) => c.nameAr).toList();
  }

  Future<List<Map<String, String>>> fetchPopularDestinations() async {
    try {
      final response = await _supabase.rpc('get_popular_destinations');
      if (response != null) {
        return (response as List).map((item) {
          return {
            'name': item['city_name']?.toString() ?? '',
            'image': item['image_url']?.toString() ?? '',
            'trips': item['trips_count']?.toString() ?? '0',
          };
        }).toList();
      }
    } catch (e) {
      print('Error fetching popular destinations: $e');
    }
    return [];
  }
}

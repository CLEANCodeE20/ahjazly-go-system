import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/faq_model.dart';
import '../models/cancellation_policy_model.dart';
import '../models/city_model.dart';

/// Abstract class for common services remote data source
abstract class CommonRemoteDataSource {
  Future<List<FAQModel>> getFAQs();
  Future<List<CancellationPolicyModel>> getCancellationPolicies();
  Future<List<CityModel>> getCities();
}

/// Implementation of common services remote data source using Supabase
class CommonRemoteDataSourceImpl implements CommonRemoteDataSource {
  final SupabaseClient supabaseClient;

  CommonRemoteDataSourceImpl(this.supabaseClient);

  @override
  Future<List<FAQModel>> getFAQs() async {
    try {
      final response = await supabaseClient
          .from('faqs')
          .select()
          .eq('is_active', true)
          .order('display_order', ascending: true);

      return (response as List)
          .map((json) => FAQModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to get FAQs: $e');
    }
  }

  @override
  Future<List<CancellationPolicyModel>> getCancellationPolicies() async {
    try {
      final response = await supabaseClient
          .from('cancel_policies')
          .select('*, partners(company_name), cancel_policy_rules(*)')
          .eq('is_active', true)
          .order('priority', ascending: false);

      return (response as List)
          .map((json) => CancellationPolicyModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to get cancellation policies: $e');
    }
  }

  @override
  Future<List<CityModel>> getCities() async {
    try {
      final response = await supabaseClient
          .from('cities')
          .select()
          .eq('is_active', true)
          .order('city_name', ascending: true);

      return (response as List)
          .map((json) => CityModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to get cities: $e');
    }
  }
}

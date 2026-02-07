import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase/supabase_service.dart';

class SupabaseFeatureService extends GetxService {
  final SupabaseClient _client = SupabaseService.to;

  /// Fetch all active FAQs from Supabase.
  Future<List<Map<String, dynamic>>> fetchFaqs() async {
    final response = await _client
        .from('faqs')
        .select()
        .eq('is_active', true)
        .order('display_order');
    return List<Map<String, dynamic>>.from(response);
  }

  /// Fetch active banners for the slider.
  Future<List<Map<String, dynamic>>> fetchBanners() async {
    try {
      final response = await _client
          .from('banners')
          .select()
          .eq('is_active', true)
          .order('display_order');
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching banners: $e');
      return [];
    }
  }

  /// Fetch cancellation policies for a specific partner.
  Future<List<Map<String, dynamic>>> fetchCancelPolicies([int? partnerId]) async {
    var query = _client
        .from('cancel_policies')
        .select('*, partners(company_name), cancel_policy_rules(*)');
    
    if (partnerId != null) {
      query = query.eq('partner_id', partnerId);
    }
    
    final response = await query.eq('is_active', true);
    return List<Map<String, dynamic>>.from(response);
  }

  /// Fetch all active partners (to show their logos).
  Future<List<Map<String, dynamic>>> fetchPartners() async {
    try {
      final response = await _client
          .from('partners')
          .select('company_name, logo_url')
          .eq('status', 'approved')
          .order('company_name');
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      print('Error fetching partners: $e');
      return [];
    }
  }
}

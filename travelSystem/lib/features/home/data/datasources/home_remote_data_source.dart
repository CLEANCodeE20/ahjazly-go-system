import '../models/banner_model.dart';
import '../models/partner_model.dart';

abstract class HomeRemoteDataSource {
  Future<List<BannerModel>> getBanners();
  Future<List<PartnerModel>> getPartners();
}

class HomeRemoteDataSourceImpl implements HomeRemoteDataSource {
  final client = Stream.empty(); // Placeholder if direct access needed, but usually we use SupabaseClient
  // For consistency with other features, I'll pass SupabaseClient
  final dynamic supabaseClient;

  HomeRemoteDataSourceImpl(this.supabaseClient);

  @override
  Future<List<BannerModel>> getBanners() async {
    final response = await supabaseClient
        .from('banners')
        .select()
        .eq('is_active', true)
        .order('display_order');
    return (response as List).map((e) => BannerModel.fromJson(e)).toList();
  }

  @override
  Future<List<PartnerModel>> getPartners() async {
    final response = await supabaseClient
        .from('partners')
        .select('company_name, logo_url')
        .eq('status', 'approved')
        .order('company_name');
    return (response as List).map((e) => PartnerModel.fromJson(e)).toList();
  }
}

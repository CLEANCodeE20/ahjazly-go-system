import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/images.dart';
import '../domain/entities/banner_entity.dart';
import '../domain/usecases/get_banners_usecase.dart';
import '../domain/usecases/get_partners_usecase.dart';
import '../../../../core/usecase/usecase.dart';

class HomeSectionController extends GetxController {
  final GetBannersUseCase _getBannersUseCase = Get.find();
  final GetPartnersUseCase _getPartnersUseCase = Get.find();

  /// بيانات السلايدر
  final RxList<BannerEntity> banners = <BannerEntity>[].obs;
  final isLoadingBanners = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchBanners();
    fetchPartnerLogos();
  }

  Future<void> fetchBanners() async {
    isLoadingBanners.value = true;
    final result = await _getBannersUseCase(NoParams());
    
    result.fold(
      (failure) => print('Error loading banners: ${failure.message}'),
      (data) => banners.value = data,
    );
    isLoadingBanners.value = false;
  }

  Future<void> fetchPartnerLogos() async {
    final result = await _getPartnersUseCase(NoParams());
    
    result.fold(
      (failure) => print('Error loading partner logos: ${failure.message}'),
      (partners) {
        final logos = partners
            .map((e) => e.logoUrl)
            .where((logo) => logo != null && logo!.isNotEmpty)
            .cast<String>()
            .toList();
        
        if (logos.isNotEmpty) {
          companyLogos.assignAll(logos);
        }
      },
    );
  }

  /// بيانات شعارات الشركات
  final RxList<String> companyLogos = <String>[
    AppImage.image_logo,
    AppImage.image_logo,
    AppImage.image_logo,
    AppImage.image_logo,
    AppImage.image_logo,
  ].obs;

  /// متغير لتتبع الصفحة الحالية في السلايدر
  var currentSliderIndex = 0.obs;

  // --- UI Event Handlers ---

  /// تُستدعى عند تغيير الصفحة في السلايدر
  void onSliderPageChanged(int index) {
    currentSliderIndex.value = index;
    update();
  }

  /// تُستدعى عند الضغط على الإعلان
  Future<void> onBannerTap(BannerEntity banner) async {
    if (banner.targetUrl == null || banner.targetUrl!.isEmpty) return;

    final url = Uri.parse(banner.targetUrl!);
    
    // إذا كان رابط خارجي، افتحه في المتصفح
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      print('Could not launch ${banner.targetUrl}');
    }
  }

}

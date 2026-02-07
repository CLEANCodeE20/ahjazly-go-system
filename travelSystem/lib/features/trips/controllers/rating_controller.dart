import 'package:get/get.dart';
import '../models/rating_model.dart';
import '../services/rating_service.dart';

// =============================================
// RATING CONTROLLER
// متحكم التقييمات
// =============================================

class RatingController extends GetxController {
  final RatingService _ratingService = RatingService();

  // Observable states
  final RxList<TripRating> tripRatings = <TripRating>[].obs;
  final Rx<PartnerRatingStats?> partnerStats = Rx<PartnerRatingStats?>(null);
  final RxBool isLoading = false.obs;
  final RxBool isSubmitting = false.obs;
  final RxString errorMessage = ''.obs;
  final RxInt currentPage = 0.obs;
  final RxBool hasMoreRatings = true.obs;

  // Rating form states
  final RxInt overallStars = 0.obs;
  final RxInt serviceStars = 0.obs;
  final RxInt cleanlinessStars = 0.obs;
  final RxInt punctualityStars = 0.obs;
  final RxInt comfortStars = 0.obs;
  final RxInt valueStars = 0.obs;
  final RxString comment = ''.obs;

  static const int pageSize = 10;

  // =============================================
  // التحقق من أهلية المستخدم للتقييم
  // =============================================
  Future<bool> checkCanRate({
    required int userId,
    required int tripId,
    required int bookingId,
  }) async {
    try {
      return await _ratingService.canUserRateTrip(
        userId: userId,
        tripId: tripId,
        bookingId: bookingId,
      );
    } catch (e) {
      errorMessage.value = 'فشل في التحقق من الأهلية: $e';
      return false;
    }
  }

  // =============================================
  // إنشاء تقييم جديد
  // =============================================
  Future<bool> createRating({
    required int tripId,
    required int bookingId,
    required int partnerId,
    int? driverId,
  }) async {
    if (overallStars.value == 0) {
      Get.snackbar(
        'تنبيه',
        'يرجى اختيار التقييم العام',
        snackPosition: SnackPosition.BOTTOM,
      );
      return false;
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
      final input = CreateRatingInput(
        tripId: tripId,
        bookingId: bookingId,
        driverId: driverId,
        partnerId: partnerId,
        stars: overallStars.value,
        serviceRating: serviceStars.value > 0 ? serviceStars.value : null,
        cleanlinessRating:
            cleanlinessStars.value > 0 ? cleanlinessStars.value : null,
        punctualityRating:
            punctualityStars.value > 0 ? punctualityStars.value : null,
        comfortRating: comfortStars.value > 0 ? comfortStars.value : null,
        valueForMoneyRating: valueStars.value > 0 ? valueStars.value : null,
        comment: comment.value.isNotEmpty ? comment.value : null,
      );

      final rating = await _ratingService.createRating(input);

      if (rating != null) {
        Get.snackbar(
          'نجح',
          'تم إضافة التقييم بنجاح',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Get.theme.colorScheme.primary,
          colorText: Get.theme.colorScheme.onPrimary,
        );
        resetForm();
        return true;
      }
      return false;
    } catch (e) {
      errorMessage.value = 'فشل في إضافة التقييم: $e';
      Get.snackbar(
        'خطأ',
        errorMessage.value,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Get.theme.colorScheme.error,
        colorText: Get.theme.colorScheme.onError,
      );
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  // =============================================
  // تحميل تقييمات الرحلة
  // =============================================
  Future<void> loadTripRatings(int tripId, {bool refresh = false}) async {
    if (refresh) {
      currentPage.value = 0;
      tripRatings.clear();
      hasMoreRatings.value = true;
    }

    if (!hasMoreRatings.value) return;

    isLoading.value = true;
    errorMessage.value = '';

    try {
      final ratings = await _ratingService.getTripRatings(
        tripId: tripId,
        limit: pageSize,
        offset: currentPage.value * pageSize,
      );

      if (ratings.isEmpty) {
        hasMoreRatings.value = false;
      } else {
        tripRatings.addAll(ratings);
        currentPage.value++;
        hasMoreRatings.value = ratings.length == pageSize;
      }
    } catch (e) {
      errorMessage.value = 'فشل في تحميل التقييمات: $e';
    } finally {
      isLoading.value = false;
    }
  }

  // =============================================
  // تحميل إحصائيات الشريك
  // =============================================
  Future<void> loadPartnerStats(int partnerId) async {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      final stats = await _ratingService.getPartnerStats(partnerId);
      partnerStats.value = stats;
    } catch (e) {
      errorMessage.value = 'فشل في تحميل الإحصائيات: $e';
    } finally {
      isLoading.value = false;
    }
  }

  // =============================================
  // تقييم مدى فائدة التقييم
  // =============================================
  Future<void> markHelpful({
    required int ratingId,
    required bool isHelpful,
  }) async {
    try {
      final result = await _ratingService.markRatingHelpful(
        ratingId: ratingId,
        isHelpful: isHelpful,
      );

      if (result != null) {
        // Update local state
        final index =
            tripRatings.indexWhere((r) => r.ratingId == ratingId);
        if (index != -1) {
          final rating = tripRatings[index];
          tripRatings[index] = TripRating(
            ratingId: rating.ratingId,
            userName: rating.userName,
            stars: rating.stars,
            serviceRating: rating.serviceRating,
            cleanlinessRating: rating.cleanlinessRating,
            punctualityRating: rating.punctualityRating,
            comfortRating: rating.comfortRating,
            valueForMoneyRating: rating.valueForMoneyRating,
            comment: rating.comment,
            ratingDate: rating.ratingDate,
            helpfulCount: result['helpful_count'] as int,
            notHelpfulCount: result['not_helpful_count'] as int,
            hasResponse: rating.hasResponse,
            responseText: rating.responseText,
            responseDate: rating.responseDate,
          );
        }
      }
    } catch (e) {
      Get.snackbar(
        'خطأ',
        'فشل في تسجيل التقييم: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  // =============================================
  // الإبلاغ عن تقييم
  // =============================================
  Future<void> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  }) async {
    try {
      final success = await _ratingService.reportRating(
        ratingId: ratingId,
        reason: reason,
        description: description,
      );

      if (success) {
        Get.snackbar(
          'نجح',
          'تم إرسال البلاغ بنجاح. سيتم مراجعته قريباً',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Get.theme.colorScheme.primary,
          colorText: Get.theme.colorScheme.onPrimary,
        );
      }
    } catch (e) {
      Get.snackbar(
        'خطأ',
        'فشل في إرسال البلاغ: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  // =============================================
  // إعادة تعيين النموذج
  // =============================================
  void resetForm() {
    overallStars.value = 0;
    serviceStars.value = 0;
    cleanlinessStars.value = 0;
    punctualityStars.value = 0;
    comfortStars.value = 0;
    valueStars.value = 0;
    comment.value = '';
  }

  // =============================================
  // تحديث التقييمات
  // =============================================
  void setOverallStars(int value) => overallStars.value = value;
  void setServiceStars(int value) => serviceStars.value = value;
  void setCleanlinessStars(int value) => cleanlinessStars.value = value;
  void setPunctualityStars(int value) => punctualityStars.value = value;
  void setComfortStars(int value) => comfortStars.value = value;
  void setValueStars(int value) => valueStars.value = value;
  void setComment(String value) => comment.value = value;

  @override
  void onClose() {
    tripRatings.clear();
    partnerStats.value = null;
    resetForm();
    super.onClose();
  }
}

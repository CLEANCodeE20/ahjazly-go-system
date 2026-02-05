import 'package:get/get.dart';
import '../../domain/entities/rating_entity.dart';
import '../../domain/usecases/submit_rating_usecase.dart';
import '../../domain/usecases/get_trip_ratings_usecase.dart';
import '../../domain/usecases/get_partner_stats_usecase.dart';
import '../../domain/usecases/mark_rating_helpful_usecase.dart';
import '../../domain/usecases/report_rating_usecase.dart';
import '../../domain/usecases/can_user_rate_trip_usecase.dart';
import '../../domain/usecases/update_rating_usecase.dart';
import '../../domain/usecases/add_partner_response_usecase.dart';

class RatingController extends GetxController {
  final SubmitRatingUseCase submitRatingUseCase;
  final GetTripRatingsUseCase getTripRatingsUseCase;
  final GetPartnerStatsUseCase getPartnerStatsUseCase;
  final MarkRatingHelpfulUseCase markRatingHelpfulUseCase;
  final ReportRatingUseCase reportRatingUseCase;
  final CanUserRateTripUseCase canUserRateTripUseCase;
  final UpdateRatingUseCase updateRatingUseCase;
  final AddPartnerResponseUseCase addPartnerResponseUseCase;

  RatingController({
    required this.submitRatingUseCase,
    required this.getTripRatingsUseCase,
    required this.getPartnerStatsUseCase,
    required this.markRatingHelpfulUseCase,
    required this.reportRatingUseCase,
    required this.canUserRateTripUseCase,
    required this.updateRatingUseCase,
    required this.addPartnerResponseUseCase,
  });

  // Observable states
  final RxList<TripRatingEntity> tripRatings = <TripRatingEntity>[].obs;
  final Rx<PartnerRatingStatsEntity?> partnerStats = Rx<PartnerRatingStatsEntity?>(null);
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

  Future<bool> checkCanRate({
    required int userId,
    required int tripId,
    required int bookingId,
  }) async {
    final result = await canUserRateTripUseCase(
      userId: userId,
      tripId: tripId,
      bookingId: bookingId,
    );
    
    return result.fold(
      (failure) {
        errorMessage.value = failure.message;
        return false;
      },
      (canRate) => canRate,
    );
  }

  Future<bool> createRating({
    required int tripId,
    required int bookingId,
    required int partnerId,
    int? driverId,
  }) async {
    if (overallStars.value == 0) {
      Get.snackbar('تنبيه', 'يرجى اختيار التقييم العام', snackPosition: SnackPosition.BOTTOM);
      return false;
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    final result = await submitRatingUseCase(
      tripId: tripId,
      bookingId: bookingId,
      partnerId: partnerId,
      driverId: driverId,
      stars: overallStars.value,
      serviceRating: serviceStars.value > 0 ? serviceStars.value : null,
      cleanlinessRating: cleanlinessStars.value > 0 ? cleanlinessStars.value : null,
      punctualityRating: punctualityStars.value > 0 ? punctualityStars.value : null,
      comfortRating: comfortStars.value > 0 ? comfortStars.value : null,
      valueForMoneyRating: valueStars.value > 0 ? valueStars.value : null,
      comment: comment.value.isNotEmpty ? comment.value : null,
    );

    isSubmitting.value = false;

    return result.fold(
      (failure) {
        errorMessage.value = failure.message;
        Get.snackbar('خطأ', errorMessage.value, snackPosition: SnackPosition.BOTTOM);
        return false;
      },
      (rating) {
        Get.snackbar('نجح', 'تم إضافة التقييم بنجاح', snackPosition: SnackPosition.BOTTOM);
        resetForm();
        return true;
      },
    );
  }

  Future<void> loadTripRatings(int tripId, {bool refresh = false}) async {
    if (refresh) {
      currentPage.value = 0;
      tripRatings.clear();
      hasMoreRatings.value = true;
    }

    if (!hasMoreRatings.value) return;

    isLoading.value = true;
    errorMessage.value = '';

    final result = await getTripRatingsUseCase(
      tripId: tripId,
      limit: pageSize,
      offset: currentPage.value * pageSize,
    );

    isLoading.value = false;

    result.fold(
      (failure) => errorMessage.value = failure.message,
      (ratings) {
        if (ratings.isEmpty) {
          hasMoreRatings.value = false;
        } else {
          tripRatings.addAll(ratings);
          currentPage.value++;
          hasMoreRatings.value = ratings.length == pageSize;
        }
      },
    );
  }

  Future<void> loadPartnerStats(int partnerId) async {
    isLoading.value = true;
    errorMessage.value = '';

    final result = await getPartnerStatsUseCase(partnerId);

    isLoading.value = false;

    result.fold(
      (failure) => errorMessage.value = failure.message,
      (stats) => partnerStats.value = stats,
    );
  }

  Future<void> markHelpful({
    required int ratingId,
    required bool isHelpful,
  }) async {
    final result = await markRatingHelpfulUseCase(
      ratingId: ratingId,
      isHelpful: isHelpful,
    );

    result.fold(
      (failure) => Get.snackbar('خطأ', failure.message, snackPosition: SnackPosition.BOTTOM),
      (data) {
        final index = tripRatings.indexWhere((r) => r.ratingId == ratingId);
        if (index != -1) {
          final rating = tripRatings[index];
          tripRatings[index] = TripRatingEntity(
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
            helpfulCount: data['helpful_count'] as int,
            notHelpfulCount: data['not_helpful_count'] as int,
            hasResponse: rating.hasResponse,
            responseText: rating.responseText,
            responseDate: rating.responseDate,
          );
        }
      },
    );
  }

  Future<void> reportRating({
    required int ratingId,
    required String reason,
    String? description,
  }) async {
    final result = await reportRatingUseCase(
      ratingId: ratingId,
      reason: reason,
      description: description,
    );

    result.fold(
      (failure) => Get.snackbar('خطأ', failure.message, snackPosition: SnackPosition.BOTTOM),
      (success) {
        if (success) {
          Get.snackbar('نجح', 'تم إرسال البلاغ بنجاح', snackPosition: SnackPosition.BOTTOM);
        }
      },
    );
  }

  void resetForm() {
    overallStars.value = 0;
    serviceStars.value = 0;
    cleanlinessStars.value = 0;
    punctualityStars.value = 0;
    comfortStars.value = 0;
    valueStars.value = 0;
    comment.value = '';
  }

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

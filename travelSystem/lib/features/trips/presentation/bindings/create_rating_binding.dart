import 'package:get/get.dart';
import '../controllers/rating_controller.dart';
import '../../data/repositories/trips_repository_impl.dart';
import '../../domain/repositories/trips_repository.dart';
import '../../data/datasources/trips_remote_data_source.dart';
import '../../../../core/network/network_info.dart';

import '../../domain/usecases/submit_rating_usecase.dart';
import '../../domain/usecases/get_trip_ratings_usecase.dart';
import '../../domain/usecases/get_partner_stats_usecase.dart';
import '../../domain/usecases/mark_rating_helpful_usecase.dart';
import '../../domain/usecases/report_rating_usecase.dart';
import '../../domain/usecases/can_user_rate_trip_usecase.dart';
import '../../domain/usecases/update_rating_usecase.dart';
import '../../domain/usecases/add_partner_response_usecase.dart';

class CreateRatingBinding extends Bindings {
  @override
  void dependencies() {
    // Repositories
    Get.lazyPut<TripsRemoteDataSource>(() => TripsRemoteDataSourceImpl(Get.find()));
    Get.lazyPut<TripsRepository>(() => TripsRepositoryImpl(
      remoteDataSource: Get.find(),
      networkInfo: Get.find(),
    ));

    // UseCases
    Get.lazyPut(() => SubmitRatingUseCase(Get.find()));
    Get.lazyPut(() => GetTripRatingsUseCase(Get.find()));
    Get.lazyPut(() => GetPartnerStatsUseCase(Get.find()));
    Get.lazyPut(() => MarkRatingHelpfulUseCase(Get.find()));
    Get.lazyPut(() => ReportRatingUseCase(Get.find()));
    Get.lazyPut(() => CanUserRateTripUseCase(Get.find()));
    Get.lazyPut(() => UpdateRatingUseCase(Get.find()));
    Get.lazyPut(() => AddPartnerResponseUseCase(Get.find()));

    Get.lazyPut<RatingController>(
      () => RatingController(
        submitRatingUseCase: Get.find(),
        getTripRatingsUseCase: Get.find(),
        getPartnerStatsUseCase: Get.find(),
        markRatingHelpfulUseCase: Get.find(),
        reportRatingUseCase: Get.find(),
        canUserRateTripUseCase: Get.find(),
        updateRatingUseCase: Get.find(),
        addPartnerResponseUseCase: Get.find(),
      ),
    );
  }
}

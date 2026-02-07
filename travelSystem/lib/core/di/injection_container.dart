import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../network/network_info.dart';
import '../services/cache_service.dart';

// Home
import '../../features/home/data/datasources/home_remote_data_source.dart';
import '../../features/home/data/repositories/home_repository_impl.dart';
import '../../features/home/domain/repositories/home_repository.dart';
import '../../features/home/domain/usecases/get_banners_usecase.dart';
import '../../features/home/domain/usecases/get_partners_usecase.dart';

// Auth
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/domain/usecases/signup_usecase.dart';
import '../../features/auth/domain/usecases/reset_password_usecase.dart';
import '../../features/auth/domain/usecases/check_email_usecase.dart';
import '../../features/auth/domain/usecases/verify_code_usecase.dart';
import '../../features/auth/domain/usecases/logout_usecase.dart';
import '../../features/auth/domain/usecases/get_current_user_usecase.dart';
import '../../../../core/usecase/usecase.dart';

// Trips
import '../../features/trips/data/datasources/trips_remote_data_source.dart';
import '../../features/trips/data/repositories/trips_repository_impl.dart';
import '../../features/trips/domain/repositories/trips_repository.dart';
import '../../features/trips/domain/usecases/get_trips_usecase.dart';
import '../../features/trips/domain/usecases/submit_rating_usecase.dart';
import '../../features/trips/domain/usecases/get_trip_ratings_usecase.dart';
import '../../features/trips/domain/usecases/get_partner_stats_usecase.dart';
import '../../features/trips/domain/usecases/mark_rating_helpful_usecase.dart';
import '../../features/trips/domain/usecases/report_rating_usecase.dart';
import '../../features/trips/domain/usecases/can_user_rate_trip_usecase.dart';
import '../../features/trips/domain/usecases/update_rating_usecase.dart';
import '../../features/trips/domain/usecases/add_partner_response_usecase.dart';
import '../../features/trips/presentation/controllers/trip_controller.dart';
import '../../features/trips/presentation/controllers/rating_controller.dart';

// Booking
import '../../features/booking/data/datasources/booking_remote_data_source.dart';
import '../../features/booking/data/repositories/booking_repository_impl.dart';
import '../../features/booking/domain/repositories/booking_repository.dart';
import '../../features/booking/domain/usecases/get_user_bookings_usecase.dart';
import '../../features/booking/domain/usecases/cancel_booking_usecase.dart';
import '../../features/booking/domain/usecases/create_booking_usecase.dart';
import '../../features/booking/domain/usecases/update_payment_status_usecase.dart';
import '../../features/booking/domain/usecases/get_available_seats_usecase.dart';

import '../../features/booking/domain/usecases/get_available_seats_usecase.dart';
import '../../features/booking/domain/usecases/upload_id_image_usecase.dart';

// Driver
import '../../features/driver/data/datasources/driver_remote_data_source.dart';
import '../../features/driver/data/repositories/driver_repository_impl.dart';
import '../../features/driver/domain/repositories/driver_repository.dart';
import '../../features/driver/domain/usecases/get_driver_profile_usecase.dart';
import '../../features/driver/domain/usecases/get_driver_stats_usecase.dart';
import '../../features/driver/domain/usecases/get_driver_trips_usecase.dart';
import '../../features/driver/domain/usecases/get_trip_passengers_usecase.dart';
import '../../features/driver/domain/usecases/update_trip_status_usecase.dart';
import '../../features/driver/domain/usecases/log_passenger_boarding_usecase.dart';
import '../../features/driver/domain/usecases/get_driver_settings_usecase.dart';
import '../../features/driver/domain/usecases/update_driver_settings_usecase.dart';
import '../../features/driver/domain/usecases/get_driver_documents_usecase.dart';
import '../../features/driver/domain/usecases/upload_driver_document_usecase.dart';
import '../../features/driver/controller/driver_documents_controller.dart';

// Profile
import '../../features/profile/data/datasources/profile_remote_data_source.dart';
import '../../features/profile/data/repositories/profile_repository_impl.dart';
import '../../features/profile/domain/repositories/profile_repository.dart';
import '../../features/profile/domain/usecases/get_user_profile_usecase.dart';
import '../../features/profile/domain/usecases/update_profile_usecase.dart';
import '../../features/profile/domain/usecases/get_notification_settings_usecase.dart';
import '../../features/profile/domain/usecases/update_notification_settings_usecase.dart';

// Support
import '../../features/support/data/datasources/support_remote_data_source.dart';
import '../../features/support/data/repositories/support_repository_impl.dart';
import '../../features/support/domain/repositories/support_repository.dart';
import '../../features/support/domain/usecases/create_support_ticket_usecase.dart';
import '../../features/support/domain/usecases/get_user_tickets_usecase.dart';
import '../../features/support/domain/usecases/get_ticket_details_usecase.dart';
import '../../features/support/controller/support_ticket_controller.dart';

// Common
import '../../features/common/data/datasources/common_remote_data_source.dart';
import '../../features/common/data/repositories/common_repository_impl.dart';
import '../../features/common/domain/repositories/common_repository.dart';
import '../../features/common/domain/usecases/get_faqs_usecase.dart';
import '../../features/common/domain/usecases/get_cancellation_policies_usecase.dart';
import '../../features/common/domain/usecases/get_cities_usecase.dart';
import '../../features/common/controller/faq_controller.dart';
import '../../features/common/controller/cancel_policies_controller.dart';

class InjectionContainer {
  static Future<void> init() async {
    // Standard Tools
    Get.lazyPut(() => Connectivity(), fenix: true);
    Get.lazyPut<SupabaseClient>(() => Supabase.instance.client, fenix: true);

    // Core
    Get.lazyPut<NetworkInfo>(() => NetworkInfoImpl(Get.find<Connectivity>()), fenix: true);

    // Features: Auth
    Get.lazyPut<AuthRemoteDataSource>(() => AuthRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<AuthRepository>(() => AuthRepositoryImpl(
      remoteDataSource: Get.find<AuthRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
    ), fenix: true);
    Get.lazyPut(() => LoginUseCase(Get.find<AuthRepository>()), fenix: true);
    Get.lazyPut(() => SignUpUseCase(Get.find<AuthRepository>()), fenix: true);
    Get.lazyPut(() => ResetPasswordUseCase(Get.find<AuthRepository>()), fenix: true);
    Get.lazyPut(() => CheckEmailUseCase(Get.find<AuthRepository>()), fenix: true);
    Get.lazyPut(() => VerifyCodeUseCase(Get.find<AuthRepository>()), fenix: true);
    Get.lazyPut(() => LogoutUseCase(Get.find<AuthRepository>()), fenix: true);
    Get.lazyPut(() => GetCurrentUserUseCase(Get.find<AuthRepository>()), fenix: true);

    // Features: Trips
    Get.lazyPut<TripsRemoteDataSource>(() => TripsRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<TripsRepository>(() => TripsRepositoryImpl(
      remoteDataSource: Get.find<TripsRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
    ), fenix: true);
    Get.lazyPut(() => GetTripsUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => SubmitRatingUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => GetTripRatingsUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => GetPartnerStatsUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => MarkRatingHelpfulUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => ReportRatingUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => CanUserRateTripUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => UpdateRatingUseCase(Get.find<TripsRepository>()), fenix: true);
    Get.lazyPut(() => AddPartnerResponseUseCase(Get.find<TripsRepository>()), fenix: true);

    Get.lazyPut(() => TripController());
    Get.lazyPut(() => RatingController(
      submitRatingUseCase: Get.find<SubmitRatingUseCase>(),
      getTripRatingsUseCase: Get.find<GetTripRatingsUseCase>(),
      getPartnerStatsUseCase: Get.find<GetPartnerStatsUseCase>(),
      markRatingHelpfulUseCase: Get.find<MarkRatingHelpfulUseCase>(),
      reportRatingUseCase: Get.find<ReportRatingUseCase>(),
      canUserRateTripUseCase: Get.find<CanUserRateTripUseCase>(),
      updateRatingUseCase: Get.find<UpdateRatingUseCase>(),
      addPartnerResponseUseCase: Get.find<AddPartnerResponseUseCase>(),
    ));

    // Features: Booking
    Get.lazyPut<BookingRemoteDataSource>(() => BookingRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<BookingRepository>(() => BookingRepositoryImpl(
      remoteDataSource: Get.find<BookingRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
    ), fenix: true);
    Get.lazyPut(() => GetUserBookingsUseCase(Get.find<BookingRepository>()), fenix: true);
    Get.lazyPut(() => CancelBookingUseCase(Get.find<BookingRepository>()), fenix: true);
    Get.lazyPut(() => CreateBookingUseCase(Get.find<BookingRepository>()), fenix: true);
    Get.lazyPut(() => UpdatePaymentStatusUseCase(Get.find<BookingRepository>()), fenix: true);
    Get.lazyPut(() => GetAvailableSeatsUseCase(Get.find<BookingRepository>()), fenix: true);
    Get.lazyPut(() => UploadIdImageUseCase(Get.find<BookingRepository>()), fenix: true);

    // Features: Driver
    Get.lazyPut<DriverRemoteDataSource>(() => DriverRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<DriverRepository>(() => DriverRepositoryImpl(
      remoteDataSource: Get.find<DriverRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
    ), fenix: true);
    Get.lazyPut(() => GetDriverProfileUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => GetDriverStatsUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => GetDriverTripsUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => GetTripPassengersUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => UpdateTripStatusUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => LogPassengerBoardingUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => GetDriverSettingsUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => UpdateDriverSettingsUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => GetDriverDocumentsUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => UploadDriverDocumentUseCase(Get.find<DriverRepository>()), fenix: true);
    Get.lazyPut(() => DriverDocumentsController());

    // Features: Profile
    Get.lazyPut<ProfileRemoteDataSource>(() => ProfileRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<ProfileRepository>(() => ProfileRepositoryImpl(
      remoteDataSource: Get.find<ProfileRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
    ), fenix: true);
    Get.lazyPut(() => GetUserProfileUseCase(Get.find<ProfileRepository>()), fenix: true);
    Get.lazyPut(() => UpdateProfileUseCase(Get.find<ProfileRepository>()), fenix: true);
    Get.lazyPut(() => GetNotificationSettingsUseCase(Get.find<ProfileRepository>()), fenix: true);
    Get.lazyPut(() => UpdateNotificationSettingsUseCase(Get.find<ProfileRepository>()), fenix: true);

    // Features: Support
    Get.lazyPut<SupportRemoteDataSource>(() => SupportRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<SupportRepository>(() => SupportRepositoryImpl(
      remoteDataSource: Get.find<SupportRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
    ), fenix: true);
    Get.lazyPut(() => CreateSupportTicketUseCase(Get.find<SupportRepository>()), fenix: true);
    Get.lazyPut(() => GetUserTicketsUseCase(Get.find<SupportRepository>()), fenix: true);
    Get.lazyPut(() => GetTicketDetailsUseCase(Get.find<SupportRepository>()), fenix: true);
    Get.lazyPut(() => SupportTicketController());

    // Features: Common
    Get.lazyPut<CommonRemoteDataSource>(() => CommonRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<CommonRepository>(() => CommonRepositoryImpl(
      remoteDataSource: Get.find<CommonRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
      cacheService: Get.find<CacheService>(),
    ), fenix: true);
    Get.lazyPut(() => GetFAQsUseCase(Get.find<CommonRepository>()), fenix: true);
    Get.lazyPut(() => GetCancellationPoliciesUseCase(Get.find<CommonRepository>()), fenix: true);
    Get.lazyPut(() => GetCitiesUseCase(Get.find<CommonRepository>()), fenix: true);
    Get.lazyPut(() => FaqController(getFAQsUseCase: Get.find<GetFAQsUseCase>()));
    Get.lazyPut(() => CancelPoliciesController());

    // Features: Home
    Get.lazyPut<HomeRemoteDataSource>(() => HomeRemoteDataSourceImpl(Get.find<SupabaseClient>()), fenix: true);
    Get.lazyPut<HomeRepository>(() => HomeRepositoryImpl(
      remoteDataSource: Get.find<HomeRemoteDataSource>(),
      networkInfo: Get.find<NetworkInfo>(),
      cacheService: Get.find<CacheService>(),
    ), fenix: true);
    Get.lazyPut(() => GetBannersUseCase(Get.find<HomeRepository>()), fenix: true);
    Get.lazyPut(() => GetPartnersUseCase(Get.find<HomeRepository>()), fenix: true);
  }
}

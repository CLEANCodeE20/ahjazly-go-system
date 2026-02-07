// routes/app_pages.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/middleware/route_middleware.dart';
import 'package:travelsystem/core/design_system/showcase.dart';
import 'package:travelsystem/features/booking/bindings/Booking_binding.dart';


import 'package:travelsystem/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:travelsystem/features/auth/presentation/screens/login.dart';
import 'package:travelsystem/features/home/presentation/screens/homepage.dart';

import '../../TestView.dart';
import '../../features/auth/bindings/login_binding.dart';
import '../../features/auth/presentation/screens/forgetpassword/ForgetPassword.dart';
import '../../features/auth/presentation/screens/forgetpassword/ForgetPassword.dart';
import '../../features/auth/presentation/screens/forgetpassword/ResetPassword.dart';
import '../../features/auth/presentation/screens/forgetpassword/VerificationCodeForget.dart';
import '../../features/auth/bindings/forget_password_binding.dart';
import '../../features/auth/bindings/verification_code_forget_binding.dart';
import '../../features/auth/bindings/reset_password_binding.dart';

import '../../features/auth/bindings/signup_binding.dart';
import '../../features/auth/presentation/screens/signup.dart';

import '../../features/auth/presentation/screens/verification_code_signup.dart';
import '../../features/booking/bindings/CreateRatingBinding.dart';
import '../../features/booking/bindings/ser_bookings_binding.dart';
import '../../features/booking/presentation/screens/BookingView.dart';
import '../../features/home/bindings/home_binding.dart';
import '../../features/home/presentation/screens/notification.dart';
import '../../features/home/presentation/widgets/home_view.dart';
import '../../features/profile/presentation/screens/CancelPoliciesPage.dart';
import '../../features/profile/presentation/screens/FaqPage.dart';
import '../../features/profile/presentation/screens/aboutApp.dart';
import '../../features/profile/presentation/screens/edit_profile_page.dart';
import '../../features/profile/presentation/screens/edit_profile_page.dart';
import '../../features/profile/presentation/screens/notification_settings_page.dart';
import '../../features/support/presentation/screens/support_help.dart';
import '../../features/support/presentation/screens/MySupportTicketsPage.dart';
import '../../features/splash/presentation/screens/splash_screen.dart';

import '../../features/trips/presentation/bindings/trip_binding.dart';
import '../../features/trips/presentation/screens/Reservations.dart';
import '../../features/trips/presentation/screens/create_rating_page.dart';
import '../../features/trips/presentation/screens/trips_page.dart';
import '../../features/profile/bindings/profile_bindings.dart';
import '../../features/booking/presentation/screens/ticket_view_screen.dart';
import '../../features/booking/bindings/ser_bookings_binding.dart';
import '../../features/driver/bindings/driver_binding.dart';
import '../../features/driver/presentation/views/driver_dashboard_view.dart';
import '../../features/driver/presentation/views/trip_details_view.dart';
import '../../features/driver/presentation/views/driver_profile_view.dart';
import '../../features/driver/presentation/views/driver_history_view.dart';
import '../../features/driver/presentation/views/driver_performance_view.dart';
import '../../features/driver/presentation/views/driver_settings_view.dart';
import '../../features/driver/presentation/views/driver_documents_view.dart';
import '../../features/wallet/presentation/views/wallet_view.dart';
import '../constants/nameRoute.dart';




List<GetPage<dynamic>>? getPages=[
  GetPage(name:AppRoute.SplashScreen, page: ()=>const SplashScreen(),middlewares: [
    RouteMiddleware(),
  ]),
  GetPage(name: AppRoute.onBording, page: ()=>const OnboardingScreen(),
  middlewares: [
   RouteMiddleware()
  ]),
  GetPage(name: AppRoute.Login, page: ()=>Login(),
  binding: LoginBinding(),
  middlewares: [
   RouteMiddleware()
  ]),
  GetPage(name: AppRoute.SingUp, page: ()=>Sginup(), binding: SignupBinding()),

  GetPage(name: AppRoute.ForgetPassword, page: ()=> ForgetPassword(), binding: ForgetPasswordBinding()),
  GetPage(name: AppRoute.VerificationCodeForget, page: ()=> VerificationCodeForget(), binding: VerificationCodeForgetBinding()),
  GetPage(name: AppRoute.ResetPassword, page: ()=>const ResetPasswordPage(), binding: ResetPasswordBinding()),

  GetPage(name: AppRoute.Homepage, page: ()=>const Homepage()),
  GetPage(name: AppRoute.VerificationCodesginup, page: ()=> const VerificationCodeSginup()),
  GetPage(name: AppRoute.notification, page: ()=>const notification()),
  GetPage(name: AppRoute.MainController, page: ()=>const HomeView(), binding: HomeBinding()),
  GetPage(name: AppRoute.Reservations, page: ()=>const Reservations(),
binding: UserBookingsBinding(),),
  GetPage(name: AppRoute.SupportAndHelp, page: ()=>const SupportAndHelp(), binding: SupportTicketBinding()),
  GetPage(name: AppRoute.AboutApp, page: ()=>const AboutApp(),),
  GetPage(
    name: AppRoute.BookingView,
    page: () => const BookingView(),
    binding: BookingBinding()
  ),
  GetPage(name: AppRoute.testview, page:()=> testview()),
  GetPage(name: AppRoute.TripsPage, page: ()=>TripsPage(), binding: TripBinding()),
  GetPage(name: AppRoute.EditProfilePage, page: () => EditProfilePage(), binding: EditProfileBinding()),
  GetPage(name: AppRoute.FaqPage, page: () => FaqPage(), binding: FaqBinding()),
  GetPage(name: AppRoute.CancelPoliciesPage, page: () => CancelPoliciesPage(), binding: CancelPoliciesBinding()),

  GetPage(name: AppRoute.NotificationSettingsPage, page: () => const NotificationSettingsPage(), binding: NotificationSettingsBinding()),
  GetPage(name: AppRoute.TicketView, page: () => TicketViewScreen(), binding: UserBookingsBinding()),
  GetPage(name: AppRoute.CreateRating, page: () => CreateRatingPage(), binding: CreateRatingBinding()),
  GetPage(name: AppRoute.MySupportTickets, page: () => const MySupportTicketsPage(), binding: SupportTicketBinding()),
  
  // Driver Routes
  GetPage(
    name: AppRoute.DriverDashboard, 
    page: () => const DriverDashboardView(), 
    binding: DriverBinding()
  ),
  GetPage(
    name: AppRoute.DriverTripDetails, 
    page: () => const TripDetailsView(), 
    binding: DriverBinding()
  ),
  GetPage(
    name: AppRoute.DriverProfile, 
    page: () => const DriverProfileView(), 
  ),
  GetPage(
    name: AppRoute.DriverHistory, 
    page: () => const DriverHistoryView(), 
    binding: DriverBinding()
  ),
  GetPage(
    name: AppRoute.DriverPerformance, 
    page: () => const DriverPerformanceView(), 
    binding: DriverBinding()
  ),
  GetPage(
    name: AppRoute.DriverSettings, 
    page: () => const DriverSettingsView(), 
    binding: DriverBinding()
  ),
  GetPage(
    name: AppRoute.DriverDocuments, 
    page: () => const DriverDocumentsView(), 
    binding: DriverBinding()
  ),
  GetPage(
    name: AppRoute.WalletPage, 
    page: () => const WalletView(), 
  ),
  GetPage(
    name: AppRoute.DesignSystemShowcase, 
    page: () => const DesignSystemShowcase(), 
  ),
];

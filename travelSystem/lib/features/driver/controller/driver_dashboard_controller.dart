import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/models/driver_model.dart';
import '../data/models/driver_trip_model.dart';
import '../../../core/classes/StatusRequest.dart';
import '../../../core/utils/error_handler.dart';
import 'package:flutter/material.dart';
import '../../auth/controller/AuthService.dart';
import '../domain/usecases/get_driver_profile_usecase.dart';
import '../domain/usecases/get_driver_stats_usecase.dart';
import '../domain/usecases/get_driver_trips_usecase.dart';

class DriverDashboardController extends GetxController {
  final GetDriverProfileUseCase _getDriverProfileUseCase = Get.find();
  final GetDriverStatsUseCase _getDriverStatsUseCase = Get.find();
  final GetDriverTripsUseCase _getDriverTripsUseCase = Get.find();
  
  RealtimeChannel? _tripsSubscription;

  // Observable state
  final isLoading = true.obs;
  final isOnline = true.obs;
  
  // Driver Info
  final statusRequest = StatRequst.succes.obs;
  
  // Driver data
  final Rx<DriverModel?> driver = Rx<DriverModel?>(null);
  
  // Trips
  final RxList<DriverTripModel> todayTrips = <DriverTripModel>[].obs;
  final RxList<DriverTripModel> upcomingTrips = <DriverTripModel>[].obs;
  final RxList<DriverTripModel> historyTrips = <DriverTripModel>[].obs;
  
  // Stats
  final totalTrips = 0.obs;
  final completedTrips = 0.obs;
  final totalPassengers = 0.obs;
  final totalEarnings = 0.0.obs;
  
  // Chart Data
  final RxList<double> weeklyTripCounts = <double>[4, 6, 5, 8, 7, 9, 6].obs; 
  
  // Next trip
  DriverTripModel? get nextTrip {
    if (todayTrips.isEmpty) return null;
    
    final now = DateTime.now();
    final upcoming = todayTrips.where((trip) => 
      trip.departureTime.isAfter(now) && 
      trip.status == 'scheduled'
    ).toList();
    
    if (upcoming.isEmpty) return null;
    
    upcoming.sort((a, b) => a.departureTime.compareTo(b.departureTime));
    return upcoming.first;
  }

  @override
  void onInit() {
    super.onInit();
    loadDashboardData();
    _setupRealtimeListener();
  }

  void _setupRealtimeListener() {
    final supabase = Supabase.instance.client;
    
    _tripsSubscription = supabase
        .channel('driver_trips_realtime')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'trips',
          callback: (payload) {
             if (payload.eventType == PostgresChangeEvent.insert) {
              Get.snackbar(
                'رحلة جديدة',
                'تم إسناد رحلة جديدة لك، تحقق من قائمة الرحلات القادمة',
                snackPosition: SnackPosition.TOP,
                duration: const Duration(seconds: 5),
              );
              loadDashboardData();
            } else if (payload.eventType == PostgresChangeEvent.update) {
              final newStatus = payload.newRecord['status'];
              if (newStatus == 'cancelled') {
                 Get.snackbar(
                  'تنبيه رحلة',
                  'تم إلغاء إحدى رحلاتك المجدولة',
                  snackPosition: SnackPosition.TOP,
                  backgroundColor: Colors.red.withOpacity(0.1),
                );
              }
              loadDashboardData();
            }
          },
        )
        .subscribe();
  }

  Future<void> loadDashboardData() async {
    try {
      isLoading.value = true;
      statusRequest.value = StatRequst.Loding;

      final authService = Get.find<AuthService>();
      final authId = authService.currentUser?.id;
      
      if (authId == null) {
        statusRequest.value = StatRequst.fielure;
        return;
      }

      // 1. Get Driver Profile
      final profileResult = await _getDriverProfileUseCase(authId);
      profileResult.fold(
        (failure) {
          statusRequest.value = StatRequst.serverfielure;
          ErrorHandler.showError(failure.message);
        },
        (driverData) {
          driver.value = driverData as DriverModel;
          
          // 2. Load other data in parallel
          _loadRemainingData(driverData.driverId);
        }
      );

    } catch (e) {
      statusRequest.value = StatRequst.oflinefielure;
      ErrorHandler.showError('خطأ في تحميل البيانات: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _loadRemainingData(int driverId) async {
    await Future.wait([
      loadTodayTrips(),
      loadUpcomingTrips(),
      loadHistoryTrips(),
      loadStats(driverId),
    ]);
    statusRequest.value = StatRequst.succes;
  }

  Future<void> loadTodayTrips() async {
    final today = DateTime.now();
    final result = await _getDriverTripsUseCase(DriverTripsParams(
      startDate: today,
      endDate: today,
    ));
    
    result.fold(
      (failure) => print('Error loading today trips: ${failure.message}'),
      (trips) => todayTrips.value = trips.cast<DriverTripModel>(),
    );
  }

  Future<void> loadUpcomingTrips() async {
    final today = DateTime.now();
    final nextWeek = today.add(const Duration(days: 7));
    
    final result = await _getDriverTripsUseCase(DriverTripsParams(
      startDate: today.add(const Duration(days: 1)),
      endDate: nextWeek,
      status: 'scheduled',
    ));

    result.fold(
      (failure) => print('Error loading upcoming trips: ${failure.message}'),
      (trips) => upcomingTrips.value = trips.cast<DriverTripModel>(),
    );
  }

  Future<void> loadHistoryTrips() async {
    final now = DateTime.now();
    final oneMonthAgo = now.subtract(const Duration(days: 30));
    
    final result = await _getDriverTripsUseCase(DriverTripsParams(
      startDate: oneMonthAgo,
      endDate: now.subtract(const Duration(days: 1)),
      status: 'completed',
    ));

    result.fold(
      (failure) => print('Error loading history trips: ${failure.message}'),
      (trips) => historyTrips.value = trips.cast<DriverTripModel>(),
    );
  }

  Future<void> loadStats(int driverId) async {
    final result = await _getDriverStatsUseCase(driverId);
    
    result.fold(
      (failure) => print('Error loading stats: ${failure.message}'),
      (stats) async {
        totalTrips.value = stats.totalTrips;
        completedTrips.value = stats.completedTrips;
        totalPassengers.value = stats.totalPassengers;

        // Fetch Earnings from partner balance report
        if (driver.value != null) {
          try {
            final supabase = Supabase.instance.client;
            final balanceData = await supabase
                .from('partner_balance_report')
                .select('current_balance')
                .eq('partner_id', driver.value!.partnerId)
                .maybeSingle();
            
            if (balanceData != null) {
              totalEarnings.value = (balanceData['current_balance'] as num).toDouble();
            }
          } catch (e) {
            print('Error fetching earnings: $e');
          }
        }
      },
    );
  }

  Future<void> refresh() async {
    await loadDashboardData();
  }

  void toggleStatus() {
    isOnline.value = !isOnline.value;
    // TODO: Sync with server
  }

  String getTimeUntilTrip(DateTime departureTime) {
    final now = DateTime.now();
    final difference = departureTime.difference(now);

    if (difference.isNegative) return 'الآن';

    if (difference.inHours > 0) {
      return 'بعد ${difference.inHours} ساعة';
    } else if (difference.inMinutes > 0) {
      return 'بعد ${difference.inMinutes} دقيقة';
    } else {
      return 'قريباً';
    }
  }

  @override
  void onClose() {
    _tripsSubscription?.unsubscribe();
    super.onClose();
  }
}

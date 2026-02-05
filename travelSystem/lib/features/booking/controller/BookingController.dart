import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../../supabase_integration/city_service.dart';
import '../../../core/constants/nameRoute.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/error_handler.dart';
import '../../../core/services/api_service.dart';
import '../../auth/controller/AuthService.dart';
import '../../trips/controller/trip_controller.dart';
import '../../trips/domain/entities/trip_entity.dart';

import '../../../core/classes/StatusRequest.dart';
import '../../../core/functions/checkEnternet.dart';
import '../../trips/presentation/screens/trips_page.dart';
import '../../trips/domain/usecases/get_trips_usecase.dart';
import '../../../../core/error/failures.dart';


class BookingController extends GetxController {
  final CityService _cityService = Get.find<CityService>();
  final AuthService _authService = Get.find<AuthService>();
  late final GetTripsUseCase _getTripsUseCase;
  
  String get welcomeMessage {
    final name = _authService.userName ?? 'مسافرنا العزيز';
    return 'أهلاً $name، إلى أين وجهتك القادمة؟';
  }
  
  // استخدام المدن الديناميكية بدلاً من الثوابت
  List<String> get cities => _cityService.getCityNames();
  final List<String> tripTypes = AppConstants.tripTypes;
  
  final requst = StatRequst.succes.obs;

  late RxString departureCity;
  late RxString arrivalCity;
  var selectedTripType = AppConstants.tripTypes[0].obs; // VIP
  var travelDate = DateTime.now().obs;

  // Mock Data for UI/UX Overhaul
  final List<Map<String, String>> recentSearches = [
    {'from': 'صنعاء', 'to': 'عدن'},
    {'from': 'تعز', 'to': 'صنعاء'},
  ].obs;

  final RxList<Map<String, String>> popularDestinations = <Map<String, String>>[
    {'name': 'صنعاء', 'image': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=60', 'trips': '25'},
    {'name': 'عدن', 'image': 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=500&q=60', 'trips': '18'},
    {'name': 'تعز', 'image': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=60', 'trips': '12'},
    {'name': 'المكلا', 'image': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=60', 'trips': '10'},
  ].obs;

  void quickSearch(String from, String to) {
    departureCity.value = from;
    arrivalCity.value = to;
    searchTrips();
  }

  @override
  void onInit() {
    super.onInit();
    // Initialize GetTripsUseCase after controller construction
    _getTripsUseCase = Get.find<GetTripsUseCase>();
    // تهيئة المدن الافتراضية من القائمة الديناميكية
    departureCity = (cities.isNotEmpty ? cities[0] : "صنعاء").obs;
    arrivalCity = (cities.length > 1 ? cities[1] : "عدن").obs;
    
    // جلب الوجهات الشائعة الفعلية
    _loadPopularDestinations();
  }

  Future<void> _loadPopularDestinations() async {
    final actualDestinations = await _cityService.fetchPopularDestinations();
    if (actualDestinations.isNotEmpty) {
      popularDestinations.assignAll(actualDestinations);
    }
  }

  final formKey = GlobalKey<FormState>();
  
  void setDepartureCity(String? city) {
    if (city != null) departureCity.value = city;
    if (city != null && arrivalCity.value == city) {
      arrivalCity.value = cities.firstWhere((c) => c != city, orElse: () => cities[0]);
    }
  }

  void setArrivalCity(String? city) {
    if (city != null) arrivalCity.value = city;
    if (city != null && departureCity.value == city) {
      departureCity.value = cities.firstWhere((c) => c != city, orElse: () => cities[0]);
    }
  }

  void setTripType(String? type) {
    if (type != null) selectedTripType.value = type;
  }

  void setDate(DateTime dt) {
    travelDate.value = dt;
  }

  /// Swap cities with animation
  void swapCities() {
    final temp = departureCity.value;
    departureCity.value = arrivalCity.value;
    arrivalCity.value = temp;
  }

  Future<void> searchTrips() async {
    requst.value = StatRequst.Loding;

    // تحويل نوع الرحلة للمطابقة مع قاعدة البيانات
    String? busClass;
    if (selectedTripType.value == 'عادي') {
      busClass = 'Standard';
    } else if (selectedTripType.value.toLowerCase() == 'vip') {
      busClass = 'VIP';
    } else {
      busClass = selectedTripType.value;
    }

    final result = await _getTripsUseCase(GetTripsParams(
      cityFrom: departureCity.value,
      cityTo: arrivalCity.value,
      date: DateFormat('yyyy-MM-dd').format(travelDate.value),
      busClass: busClass,
    ));

    result.fold(
      (failure) {
        if (failure is OfflineFailure) {
          requst.value = StatRequst.noInternet;
        } else {
          requst.value = StatRequst.oflinefielure;
        }
        ErrorHandler.showError(failure.message);
      },
      (trips) {
        if (trips.isNotEmpty) {
          requst.value = StatRequst.succes;
          ErrorHandler.showSuccess('تم العثور على ${trips.length} رحلة');
          
          // مزامنة نوع الرحلة المختار مع TripController
          try {
            final tripController = Get.find<TripController>();
            tripController.selectedTripType.value = selectedTripType.value;
          } catch (e) {
            // تجاهل إذا لم يكن موجوداً بعد
          }
          
          Get.toNamed(AppRoute.TripsPage, arguments: trips);
        } else {
          requst.value = StatRequst.oflinefielure;
          ErrorHandler.showInfo('لم يتم العثور على رحلات لهذه المعايير حالياً');
        }
      },
    );
  }

}

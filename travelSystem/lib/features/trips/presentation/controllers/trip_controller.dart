import 'package:get/get.dart';
import '../../domain/entities/trip_entity.dart';

class TripController extends GetxController {
  RxList<TripEntity> trips = <TripEntity>[].obs;
  RxList<TripEntity> filteredTrips = <TripEntity>[].obs;
  RxBool loading = false.obs;

  RxInt maxPrice = 1000.obs;
  RxString selectedTripType = ''.obs;
  RxString selectedCompanyName = ''.obs;
  RxString selectedTimeFilter = ''.obs;

  // لا داعي لـ onInit هنا... فقط املأ trips من TripsPage عند الاستلام.

  void setTrips(List<TripEntity> tripList) {
    trips.value = tripList;
    filteredTrips.value = tripList;
    loading.value = false;
  }

  void applyFilter() {
    filteredTrips.value = trips.where((trip) {
      bool priceOK = trip.priceAdult <= maxPrice.value;
      
      // منطق تحويل الأنواع للمطابقة
      String normalizedSelected = selectedTripType.value.toLowerCase();
      String normalizedTripType = trip.tripType.toLowerCase();
      
      bool typeOK = selectedTripType.value.isEmpty;
      if (!typeOK) {
        if (normalizedSelected == 'عادي' || normalizedSelected == 'standard') {
          typeOK = normalizedTripType == 'standard' || normalizedTripType == 'عادي';
        } else if (normalizedSelected == 'vip') {
          typeOK = normalizedTripType == 'vip';
        } else {
          typeOK = normalizedTripType == normalizedSelected;
        }
      }

      bool companyOK = selectedCompanyName.value.isEmpty || trip.companyName == selectedCompanyName.value;
      bool timeOK = selectedTimeFilter.value.isEmpty || matchTimeFilter(trip.timeFrom);
      return priceOK && typeOK && companyOK && timeOK;
    }).toList();
  }

  bool matchTimeFilter(String time) {
    int hour = int.tryParse(time.split(":")[0]) ?? 0;
    if (selectedTimeFilter.value == "بعد منتصف الليل")
      return hour >= 0 && hour < 6;
    if (selectedTimeFilter.value == "قبل الظهيرة")
      return hour >= 6 && hour < 12;
    if (selectedTimeFilter.value == "بعد الظهيرة")
      return hour >= 12 && hour < 18;
    if (selectedTimeFilter.value == "المساء")
      return hour >= 18 && hour <= 23;
    return true;
  }

  void resetFilter() {
    maxPrice.value = 1000;
    selectedTripType.value = '';
    selectedCompanyName.value = '';
    selectedTimeFilter.value = '';
    applyFilter();
  }
}

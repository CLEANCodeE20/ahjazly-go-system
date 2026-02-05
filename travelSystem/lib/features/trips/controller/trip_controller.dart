import 'package:get/get.dart';
import '../data/models/BusTrip.dart';

class TripController extends GetxController {
  RxList<BusTrip> trips = <BusTrip>[].obs;
  RxList<BusTrip> filteredTrips = <BusTrip>[].obs;
  RxBool loading = false.obs;

  RxInt maxPrice = 1000.obs;
  RxString selectedTripType = ''.obs;
  RxString selectedCompanyName = ''.obs;
  RxString selectedTimeFilter = ''.obs;

  // لا داعي لـ onInit هنا... فقط املأ trips من TripsPage عند الاستلام.

  void setTrips(List<BusTrip> tripList) {
    trips.value = tripList;
    filteredTrips.value = tripList;
    loading.value = false;
  }

  void applyFilter() {
    filteredTrips.value = trips.where((trip) {
      bool priceOK = trip.priceAdult <= maxPrice.value;
      bool typeOK = selectedTripType.value.isEmpty || trip.tripType == selectedTripType.value;
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

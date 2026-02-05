import 'package:get/get.dart';
import '../data/models/driver_trip_model.dart';
import '../data/models/trip_passenger_model.dart';
import '../domain/entities/trip_passenger_entity.dart';
import '../presentation/views/qr_scanner_view.dart';
import '../../../core/utils/error_handler.dart';
import '../domain/usecases/get_trip_passengers_usecase.dart';
import '../domain/usecases/update_trip_status_usecase.dart';
import '../domain/usecases/log_passenger_boarding_usecase.dart';

class DriverTripController extends GetxController {
  final GetTripPassengersUseCase _getTripPassengersUseCase = Get.find();
  final UpdateTripStatusUseCase _updateTripStatusUseCase = Get.find();
  final LogPassengerBoardingUseCase _logPassengerBoardingUseCase = Get.find();

  // Current trip
  final Rx<DriverTripModel?> currentTrip = Rx<DriverTripModel?>(null);
  
  // Passengers
  final RxList<TripPassengerEntity> passengers = <TripPassengerEntity>[].obs;
  final isLoadingPassengers = false.obs;
  
  // Boarding
  final boardedCount = 0.obs;
  
  int get totalPassengers => passengers.length;
  int get pendingPassengers => totalPassengers - boardedCount.value;

  void setTrip(DriverTripModel trip) {
    currentTrip.value = trip;
    loadPassengers();
  }

  Future<void> loadPassengers() async {
    if (currentTrip.value == null) return;

    try {
      isLoadingPassengers.value = true;
      
      final result = await _getTripPassengersUseCase(currentTrip.value!.tripId);
      
      result.fold(
        (failure) => ErrorHandler.showError('خطأ في تحميل الركاب: ${failure.message}'),
        (passengersList) {
          passengers.value = passengersList;
          boardedCount.value = passengersList.where((p) => p.isBoarded).length;
        }
      );
    } catch (e) {
      ErrorHandler.showError('خطأ غير متوقع: $e');
    } finally {
      isLoadingPassengers.value = false;
    }
  }

  Future<void> updateTripStatus(String newStatus) async {
    if (currentTrip.value == null) return;

    try {
      final result = await _updateTripStatusUseCase(UpdateTripStatusParams(
        tripId: currentTrip.value!.tripId,
        newStatus: newStatus,
      ));

      result.fold(
        (failure) => ErrorHandler.showError(failure.message),
        (res) {
          if (res['success'] == true) {
            ErrorHandler.showSuccess('تم تحديث حالة الرحلة');
            
            // Update local trip status
            currentTrip.value = DriverTripModel(
              tripId: currentTrip.value!.tripId,
              routeId: currentTrip.value!.routeId,
              busId: currentTrip.value!.busId,
              departureTime: currentTrip.value!.departureTime,
              arrivalTime: currentTrip.value!.arrivalTime,
              status: newStatus,
              basePrice: currentTrip.value!.basePrice,
              originCity: currentTrip.value!.originCity,
              destinationCity: currentTrip.value!.destinationCity,
              busLicensePlate: currentTrip.value!.busLicensePlate,
              passengerCount: currentTrip.value!.passengerCount,
            );
          } else {
            ErrorHandler.showError(res['error'] ?? 'فشل التحديث');
          }
        }
      );
    } catch (e) {
      ErrorHandler.showError('خطأ في تحديث الحالة: $e');
    }
  }

  Future<void> markPassengerBoarded(TripPassengerEntity passenger) async {
    if (currentTrip.value == null) return;

    try {
      final result = await _logPassengerBoardingUseCase(LogPassengerBoardingParams(
        passengerId: passenger.passengerId,
        tripId: currentTrip.value!.tripId,
        boardingMethod: 'manual',
      ));

      result.fold(
        (failure) => ErrorHandler.showError(failure.message),
        (res) {
          if (res['success'] == true) {
            // Update local passenger status
            final index = passengers.indexWhere(
              (p) => p.passengerId == passenger.passengerId,
            );
            
            if (index != -1) {
              passengers[index] = passenger.copyWith(isBoarded: true);
              boardedCount.value++;
            }

            ErrorHandler.showSuccess('تم تسجيل صعود الراكب');
          } else {
            ErrorHandler.showError(res['error'] ?? 'فشل التسجيل');
          }
        }
      );
    } catch (e) {
      ErrorHandler.showError('خطأ في تسجيل الصعود: $e');
    }
  }

  Future<void> scanQRCode() async {
    if (currentTrip.value == null) return;

    final result = await Get.to(() => const QRScannerView());
    
    if (result != null && result is String) {
      final int? passengerId = int.tryParse(result);
      
      if (passengerId != null) {
        final passenger = passengers.firstWhereOrNull(
          (p) => p.passengerId == passengerId
        );

        if (passenger != null) {
          if (passenger.isBoarded) {
            ErrorHandler.showInfo('الراكب مسجل مسبقاً');
          } else {
            await markPassengerBoarded(passenger);
          }
        } else {
          ErrorHandler.showError('هذا الراكب غير موجود في هذه الرحلة');
        }
      } else {
        ErrorHandler.showError('رمز غير صالح');
      }
    }
  }
}

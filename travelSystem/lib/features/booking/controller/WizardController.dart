import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:collection/collection.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../auth/controller/AuthService.dart';

import '../data/models/passenger_model.dart';
import '../domain/entities/passenger_entity.dart';
import '../domain/usecases/create_booking_params.dart';
import '../../../core/utils/error_handler.dart';
import '../domain/usecases/create_booking_usecase.dart';
import '../domain/usecases/update_payment_status_usecase.dart';
import '../domain/usecases/upload_id_image_usecase.dart';
import '../domain/repositories/booking_repository.dart';
import '../../trips/domain/entities/trip_entity.dart';

class WizardController extends GetxController {
  TripEntity? trip;
  int tripId = 0;

  int adultsCount = 1;
  int childrenCount = 0;

  // ركاب
  final passengers = <PassengerModel>[].obs;

  // خطوة الـ Wizard الحالية
  int currentStep = 0;

  // معرف الحجز بعد الإنشاء
  int? bookingId;

  late final AuthService _auth;
  final CreateBookingUseCase _createBookingUseCase = Get.find();
  final UpdatePaymentStatusUseCase _updatePaymentStatusUseCase = Get.find();
  final UploadIdImageUseCase _uploadIdImageUseCase = Get.find();

  @override
  void onInit() {
    super.onInit();
    _auth = Get.find<AuthService>();
  }

  Future<String?> uploadPassengerIdPhoto(int index, List<int> bytes) async {
    final fileName = 'passenger_${index}_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final result = await _uploadIdImageUseCase(fileName, bytes);
    
    return result.fold(
      (failure) {
        ErrorHandler.showError(failure.message, type: ErrorType.server);
        return null;
      },
      (url) {
        if (url != null) {
          updatePassengerIdPhoto(index, url);
        }
        return url;
      },
    );
  }

  // اختيار الرحلة
  void selectTrip(TripEntity t) {
    trip = t;
    tripId = t.tripNumber;
    checkExistingPendingBooking();
  }

  Future<void> checkExistingPendingBooking() async {
    if (_auth.currentUser == null) return;
    
    final result = await Get.find<BookingRepository>().getUserBookings(_auth.currentUser!.id);
    result.fold(
      (failure) => null,
      (bookings) {
        final existing = bookings.firstWhereOrNull(
          (b) => b.tripId == tripId && 
                 b.bookingStatus.toLowerCase().contains('pending') &&
                 (b.expiresAt == null || b.expiresAt!.isAfter(DateTime.now()))
        );
        
        if (existing != null) {
          bookingId = existing.bookingId;
          // Optionally populate passengers if needed
          // For now, just setting bookingId is enough for idempotency
          update();
          
          Get.dialog(
            AlertDialog(
              title: const Text('حجز غير مكتمل'),
              content: const Text('لديك حجز معلق لهذه الرحلة. هل ترغب في استكماله؟'),
              actions: [
                TextButton(
                  onPressed: () => Get.back(),
                  child: const Text('بدء حجز جديد'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Get.back();
                    currentStep = 3; // Go to summary step
                    update();
                  },
                  child: const Text('استكمال الحجز'),
                ),
              ],
            )
          );
        }
      }
    );
  }

  void _resetBookingId() {
    if (bookingId != null) {
      bookingId = null;
      update();
    }
  }

  // عدد الركاب
  void setPassengerCounts(int adults, int children) {
    _resetBookingId();
    adultsCount = adults;
    childrenCount = children;

    final total = adults + children;
    passengers.clear();

    for (int i = 0; i < total; i++) {
      passengers.add(
        PassengerModel(
          fullName: '',
          idNumber: '',
        ),
      );
    }
    update();
  }

  void updatePassengerName(int index, String name) {
    if (index < passengers.length) {
      _resetBookingId();
      passengers[index].fullName = name;
      passengers.refresh();
    }
  }

  void updatePassengerId(int index, String id) {
    if (index < passengers.length) {
      _resetBookingId();
      passengers[index].idNumber = id;
      passengers.refresh();
    }
  }

  void updatePassengerIdPhoto(int index, String idPhoto) {
    if (index < passengers.length) {
      _resetBookingId();
      passengers[index].idPhoto = idPhoto;
      passengers.refresh();
    }
  }

  void assignSeatToPassenger(
      int passengerIndex, int layoutNumber, String seatCode, {int? seatId}) {
    if (passengerIndex < passengers.length) {
      _resetBookingId();
      passengers[passengerIndex].seatLayoutNumber = layoutNumber;
      passengers[passengerIndex].seatCode = seatCode;
      passengers[passengerIndex].seatId = seatId;
      passengers.refresh();
    }
  }

  // التنقل بين الخطوات
  void nextStep() {
    currentStep++;
    update();
  }

  void previousStep() {
    if (currentStep > 0) {
      currentStep--;
      update();
    }
  }

  // حساب السعر الكلي
  num get totalPrice {
    if (trip == null) return 0;
    return adultsCount * trip!.priceAdult +
        childrenCount * trip!.priceChild;
  }

  // إنشاء الحجز
  Future<bool> createBooking() async {
    // إذا كان الحجز موجوداً بالفعل (ولم يتم تصفيره بسبب تعديل البيانات)، لا تقم بإنشائه مرة أخرى
    if (bookingId != null) {
      return true;
    }

    if (trip == null) return false;

    if (_auth.userId == null) {
      ErrorHandler.showError('يجب تسجيل الدخول أولاً', type: ErrorType.validation);
      return false;
    }

    final entityPassengers = passengers.map((p) => PassengerEntity(
      fullName: p.fullName,
      idNumber: p.idNumber,
      seatId: p.seatId,
      gender: p.gender,
      birthDate: p.birthDate,
      phoneNumber: p.phoneNumber,
      idPhoto: p.idPhoto,
    )).toList();

    final result = await _createBookingUseCase(CreateBookingParams(
      userId: _auth.userId!,
      tripId: tripId,
      totalPrice: totalPrice.toDouble(),
      paymentMethod: 'cash', 
      passengers: entityPassengers,
    ));

    return result.fold(
      (failure) {
        ErrorHandler.showError(failure.message, type: ErrorType.server);
        return false;
      },
      (booking) {
        bookingId = booking.bookingId;
        update();
        return true;
      },
    );
  }

  // تحديث حالة الدفع
  Future<bool> confirmPayment({
    String paymentStatus = 'paid',
    String paymentMethod = 'cash',
    String transactionId = '',
  }) async {
    if (bookingId == null) {
      ErrorHandler.showError('لا يوجد حجز مؤكد بعد', type: ErrorType.validation);
      return false;
    }

    // Special handling for Ahjazly Wallet
    if (paymentMethod == 'ahjazly_wallet') {
      try {
        final supabase = Supabase.instance.client;
        final result = await supabase.rpc('process_wallet_transaction', params: {
          'p_user_id': _auth.userId,
          'p_type': 'payment',
          'p_amount': totalPrice.toDouble(),
          'p_reference_id': 'BOOKING-$bookingId',
          'p_description': 'دفع حجز رقم $bookingId'
        });
        
        // If RPC fails, it will throw an exception
      } catch (e) {
        ErrorHandler.showError('فشل الدفع عبر المحفظة: $e', type: ErrorType.server);
        return false;
      }
    }

    final result = await _updatePaymentStatusUseCase(UpdatePaymentParams(
      bookingId: bookingId!,
      status: paymentStatus,
      method: paymentMethod,
      transactionId: transactionId,
    ));

    return result.fold(
      (failure) {
        ErrorHandler.showError(failure.message, type: ErrorType.server);
        return false;
      },
      (_) => true,
    );
  }
}

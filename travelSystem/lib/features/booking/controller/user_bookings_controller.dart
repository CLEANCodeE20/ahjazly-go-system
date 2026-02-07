// controller/booking/user_bookings_controller.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../../../core/classes/StatusRequest.dart';
import '../../../core/constants/Color.dart';
import '../../../core/constants/nameRoute.dart';
import '../../auth/controller/AuthService.dart';

import '../domain/entities/booking_entity.dart';
import '../domain/usecases/get_user_bookings_usecase.dart';
import '../domain/usecases/cancel_booking_usecase.dart';
import '../domain/entities/cancel_preview_entity.dart';
import '../../../../core/error/failures.dart';

enum BookingFilter { Pending, confirmed, completed, cancelled }

class UserBookingsController extends GetxController {
  final allBookings = <BookingEntity>[].obs;
  final filteredBookings = <BookingEntity>[].obs;
  final isLoading = false.obs;
  final errorMessage = ''.obs;
  final status = StatRequst.Loding.obs;

  final currentFilter = BookingFilter.Pending.obs;
  
  final GetUserBookingsUseCase _getUserBookingsUseCase = Get.find();
  final CancelBookingUseCase _cancelBookingUseCase = Get.find();
  final AuthService _authService = Get.find();
  
  late int userId;

  @override
  void onInit() {
    super.onInit();
    allBookings.clear();
    filteredBookings.clear();
    
    if (_authService.isAuthenticated) {
      fetchBookings();
    }
  }

  Future<void> fetchBookings() async {
    final authId = _authService.currentUser?.id;

    if (authId == null) {
      status.value = StatRequst.fielure;
      return;
    }

    status.value = StatRequst.Loding;
    isLoading.value = true;
    errorMessage.value = '';

    final result = await _getUserBookingsUseCase(authId);

    result.fold(
      (failure) {
        status.value = StatRequst.oflinefielure;
        errorMessage.value = failure.message;
      },
      (bookings) {
        allBookings.assignAll(bookings);
        _applyFilter();
        status.value = StatRequst.succes;
      },
    );
    isLoading.value = false;
  }

  void changeFilter(BookingFilter filter) {
    currentFilter.value = filter;
    _applyFilter();
  }

  void _applyFilter() {
    final statusMap = {
      BookingFilter.Pending: ['Pending', 'قيد المراجعه'],
      BookingFilter.confirmed: ['Confirmed', 'مؤكده', 'paid', 'مدفوعه'],
      BookingFilter.completed: ['completed', 'مكتملة'],
      BookingFilter.cancelled: ['Cancelled', 'rejected', 'المنتهيه', 'مرفوض'],
    };

    final targets = statusMap[currentFilter.value]!;
    print("Filtering with: $currentFilter, targets: $targets"); // DEBUG
    filteredBookings.value = allBookings.where((b) {
      final status = b.bookingStatus.toLowerCase();
      return targets.any((t) => t.toLowerCase() == status);
    }).toList();
  }

  Future<void> cancelBooking(int bookingId) async {
    Get.dialog(const Center(child: CircularProgressIndicator()), barrierDismissible: false);
    
    final result = await _cancelBookingUseCase(CancelBookingParams(
      bookingId: bookingId,
      confirm: false,
    ));

    if (Get.isDialogOpen!) Get.back();

    result.fold(
      (failure) {
        Get.snackbar('خطأ', 'حدث خطأ أثناء فحص سياسة الإلغاء: ${failure.message}');
      },
      (preview) {
        _showCancelPreviewSheet(preview);
      },
    );
  }

  void _showCancelPreviewSheet(CancelPreviewEntity preview) {
    final bool isZeroRefund = preview.calculated.refundAmount <= 0;

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Icon(
                  isZeroRefund ? Icons.warning_amber_rounded : Icons.info_outline,
                  color: isZeroRefund ? Colors.red : AppColor.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  isZeroRefund ? 'تحذير: إلغاء بدون استرداد' : 'تفاصيل إلغاء الحجز',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isZeroRefund ? Colors.red : Colors.black,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isZeroRefund ? Colors.red.withOpacity(0.05) : Colors.blue.withOpacity(0.05),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isZeroRefund ? Colors.red.withOpacity(0.2) : Colors.blue.withOpacity(0.2),
                ),
              ),
              child: Text(
                isZeroRefund
                    ? 'عذراً، لا تتيح سياسة الإلغاء الحالية استرداد أي مبلغ في هذا الوقت (${preview.hoursBeforeDeparture.toStringAsFixed(1)} ساعة قبل الرحلة).'
                    : 'سيتم تطبيق سياسة الإلغاء بناءً على الوقت المتبقي (${preview.hoursBeforeDeparture.toStringAsFixed(1)} ساعة).',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  color: isZeroRefund ? Colors.red[700] : Colors.blue[700],
                ),
              ),
            ),
            const SizedBox(height: 20),
            _rowInfo('إجمالي المبلغ المدفوع', '${preview.totalPrice} ر.س'),
            _rowInfo('نسبة الاسترداد', '${preview.rule.refundPercentage}%'),
            _rowInfo('رسوم الإلغاء', '${preview.rule.cancellationFee} ر.س'),
            const Divider(height: 30),
            _rowInfo(
              'المبلغ المسترد المتوقع',
              '${preview.calculated.refundAmount} ر.س',
              isBold: true,
              color: isZeroRefund ? Colors.red : AppColor.color_primary,
            ),
            if (isZeroRefund) ...[
              const SizedBox(height: 10),
              const Text(
                '* ملاحظة: هذا الحجز غير قابل للاسترداد حالياً حسب سياسة الشركة.',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 11, color: Colors.grey),
              ),
            ],
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Get.back(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                    child: const Text('تراجع', style: TextStyle(fontFamily: 'Cairo')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Get.back();
                      _confirmCancellation(preview.bookingId);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isZeroRefund ? Colors.grey[800] : Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      elevation: 0,
                    ),
                    child: Text(
                      isZeroRefund ? 'إلغاء على أي حال' : 'تأكيد الإلغاء',
                      style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
      isScrollControlled: true,
    );
  }

  Widget _rowInfo(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey),
          ),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color ?? Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmCancellation(int bookingId) async {
    Get.dialog(const Center(child: CircularProgressIndicator()), barrierDismissible: false);
    
    final result = await _cancelBookingUseCase(CancelBookingParams(
      bookingId: bookingId,
      confirm: true,
      reason: "Customer request from app",
    ));

    if (Get.isDialogOpen!) Get.back();

    result.fold(
      (failure) {
        Get.snackbar('خطأ', 'حدث خطأ أثناء تأكيد الإلغاء: ${failure.message}');
      },
      (preview) {
        // Explicit success since we have a preview object
          Get.snackbar('تم الإلغاء', 'تم إلغاء الحجز ومعالجة الاسترداد بنجاح',
              backgroundColor: Colors.green, colorText: Colors.white);
          fetchBookings();
      },
    );
    isLoading.value = false;
  }

  void completePayment(int bookingId) {
    // TODO: Navigate to payment screen
    Get.snackbar('الدفع', 'الانتقال إلى بوابة الدفع...');
  }

  void viewTicket(int bookingId) {
    final booking = allBookings.firstWhere((e) => e.bookingId == bookingId);
    Get.toNamed(AppRoute.TicketView, arguments: booking);
  }
}

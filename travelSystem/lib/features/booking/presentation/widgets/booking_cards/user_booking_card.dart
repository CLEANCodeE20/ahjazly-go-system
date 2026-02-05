import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../../core/constants/Color.dart';
import '../../../../../core/utils/payment_mapper.dart';

import '../../../../trips/presentation/bindings/create_rating_binding.dart';
import '../../../../trips/presentation/screens/create_rating_page.dart';
import '../../../controller/user_bookings_controller.dart';
import '../../../domain/entities/booking_entity.dart';



class UserBookingCard extends StatelessWidget {
  final BookingEntity b;
  const UserBookingCard({super.key, required this.b});

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'مؤكده':
        return Colors.green;
      case 'pending':
      case 'قيد المراجعه':
        return Colors.orange;
      case 'paid':
      case 'مدفوعه':
        return Colors.blue;
      case 'finished':
      case 'completed':
      case 'المنتهيه':
        return Colors.grey;
      case 'cancelled':
      case 'rejected':
      case 'مرفوض':
      case 'ملغية':
        return Colors.red;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<UserBookingsController>();
    final statusColor = _statusColor(b.bookingStatus);
    final depTime = TimeOfDay.fromDateTime(b.departureTime).format(context);
    final arrTime = TimeOfDay.fromDateTime(b.arrivalTime).format(context);

    final s = b.bookingStatus.toLowerCase();
    final isConfirmed = s.contains('confirmed') || s.contains('مؤكد') || s.contains('paid');
    final isPaid = s.contains('paid') || s.contains('مدفوع');
    final isCancelled = s.contains('cancel') || s.contains('reject') || s.contains('ملغ') || s.contains('مرفوض');

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.3 : 0.04),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Upper Part: Flight-like Info
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildCityInfo(context, b.originCity, depTime, Alignment.centerRight),
                    Column(
                      children: [
                        Icon(Icons.directions_bus_rounded, color: Theme.of(context).colorScheme.primary.withOpacity(0.3), size: 20),
                        const SizedBox(height: 4),
                        Container(
                          width: 60,
                          height: 1,
                          color: Theme.of(context).dividerColor.withOpacity(0.1),
                        ),
                      ],
                    ),
                    _buildCityInfo(context, b.destinationCity, arrTime, Alignment.centerLeft),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Flexible(child: _buildTicketDetail(context, Icons.person_outline_rounded, b.passengerName ?? b.fullName)),
                    if (b.passengers != null && b.passengers!.length > 1) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '+${b.passengers!.length - 1}',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(width: 15),
                    Flexible(child: _buildTicketDetail(context, Icons.airline_seat_recline_extra_rounded, b.busClass)),
                    const Spacer(),
                    _buildStatusBadge(b.bookingStatus, statusColor),
                  ],
                ),
                if (b.seatNumber != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Flexible(child: _buildTicketDetail(context, Icons.event_seat_rounded, '${"رقم المقعد".tr}: ${b.seatNumber}')),
                      const SizedBox(width: 15),
                      Flexible(child: _buildTicketDetail(context, Icons.business_rounded, b.companyName)),
                    ],
                  ),
                ],
                if (b.paymentMethod != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Flexible(
                        child: _buildTicketDetail(
                          context, 
                          Icons.payments_outlined, 
                          '${"وسيلة الدفع".tr}: ${PaymentMapper.toDisplayName(b.paymentMethod)}'
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Dashed Divider
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 0),
            child: Row(
              children: [
                _buildCutout(context, true),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return Flex(
                        direction: Axis.horizontal,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: List.generate(
                          (constraints.constrainWidth() / 10).floor(),
                          (index) => SizedBox(
                            width: 5,
                            height: 1,
                            child: DecoratedBox(decoration: BoxDecoration(color: Theme.of(context).dividerColor.withOpacity(0.1))),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                _buildCutout(context, false),
              ],
            ),
          ),

          // Lower Part: Price & Actions
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 15, 20, 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('إجمالي السعر'.tr, style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 11, fontFamily: 'Cairo')),
                    Text(
                      '${b.basePrice.toStringAsFixed(0)} ر.س',
                      style: TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).textTheme.titleLarge?.color),
                    ),
                  ],
                ),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (!isCancelled) ...[
                        if (isConfirmed) ...[
                          _buildSmallBtn(context, 'التذكرة'.tr, Theme.of(context).colorScheme.primary, true, () => controller.viewTicket(b.bookingId)),
                          const SizedBox(width: 8),
                          _buildSmallBtn(context, 'إلغاء'.tr, Colors.red, false, () => controller.cancelBooking(b.bookingId)),
                        ] else if (s.contains('pending') || s.contains('قيد')) ...[
                          if (b.expiresAt != null && b.expiresAt!.isAfter(DateTime.now())) ...[
                             _buildSmallBtn(context, 'إكمال الدفع'.tr, Theme.of(context).colorScheme.primary, true, () {
                               // Navigate to Wizard with this booking
                               // We need to find a way to resume. For now, let's just show the button.
                               // In a real scenario, we would initialize WizardController with this booking.
                               Get.snackbar('تنبيه', 'سيتم توجيهك لإكمال الدفع');
                             }),
                             const SizedBox(width: 8),
                             _buildCountdown(context, b.expiresAt!),
                          ] else ...[
                            const Icon(Icons.hourglass_empty_rounded, size: 14, color: Colors.orange),
                            const SizedBox(width: 4),
                            Text('بانتظار تأكيد الشركة'.tr, style: const TextStyle(color: Colors.orange, fontSize: 12, fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
                          ],
                          const Spacer(),
                          _buildSmallBtn(context, 'إلغاء الطلب'.tr, Colors.red, false, () => controller.cancelBooking(b.bookingId)),
                        ] else
                          Text('#${b.bookingId}', style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                      ] else ...[
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('ملغاة'.tr,
                                style: const TextStyle(
                                    color: Colors.red,
                                    fontFamily: 'Cairo',
                                    fontWeight: FontWeight.bold)),
                            if (b.refundAmount != null && b.refundAmount! > 0)
                              Text(
                                'تم استرداد: ${b.refundAmount!.toStringAsFixed(0)} ر.س',
                                style: const TextStyle(
                                  color: Colors.green,
                                  fontSize: 11,
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // RATE TRIP BUTTON (Only for Completed & Not Rated)
          if ((s.contains('completed') || s.contains('منتهي')) && !b.hasRating)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Navigate to rating page
                    if (b.partnerId != null) {
                         Get.to(
                           () => const CreateRatingPage(),
                           binding: CreateRatingBinding(),
                           arguments: {
                             'tripId': b.tripId,
                             'bookingId': b.bookingId,
                             'partnerId': b.partnerId,
                             'driverId': b.driverId,
                             'routeName': '${b.originCity} - ${b.destinationCity}',
                           }
                         )?.then((result) {
                             if (result == true) {
                                 // Refresh bookings via controller
                                 Get.find<UserBookingsController>().fetchBookings();
                             }
                         });
                    } else {
                        Get.snackbar('تنبيه', 'بيانات الشريك غير متوفرة للتقييم');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFA000),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.star_rate_rounded, size: 18),
                  label: Text('قيم الرحلة الآن'.tr, style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
                ),
              ),
            ),
            
          // RATED INDICATOR
          if ((s.contains('completed') || s.contains('منتهي')) && b.hasRating)
             Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.green, size: 18),
                    const SizedBox(width: 8),
                    Text('شكراً لك، تم تقييم الرحلة'.tr, style: const TextStyle(color: Colors.green, fontFamily: 'Cairo', fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCityInfo(BuildContext context, String city, String time, Alignment alignment) {
    return Column(
      crossAxisAlignment: alignment == Alignment.centerRight ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      children: [
        Text(time, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
        Text(city, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }

  Widget _buildTicketDetail(BuildContext context, IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Theme.of(context).textTheme.bodySmall?.color),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            label, 
            style: Theme.of(context).textTheme.bodySmall,
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status,
        style: TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Widget _buildCutout(BuildContext context, bool isRight) {
    return Container(
      width: 10,
      height: 20,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor, // Match scaffold background
        borderRadius: BorderRadius.only(
          topRight: isRight ? const Radius.circular(20) : Radius.zero,
          bottomRight: isRight ? const Radius.circular(20) : Radius.zero,
          topLeft: !isRight ? const Radius.circular(20) : Radius.zero,
          bottomLeft: !isRight ? const Radius.circular(20) : Radius.zero,
        ),
      ),
    );
  }

  Widget _buildCountdown(BuildContext context, DateTime expiry) {
    return _CountdownWidget(expiry: expiry);
  }

  Widget _buildSmallBtn(BuildContext context, String label, Color color, bool isPrimary, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isPrimary ? color : color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: isPrimary ? null : Border.all(color: color.withOpacity(0.2)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isPrimary ? (Theme.of(context).brightness == Brightness.dark ? Colors.black : Colors.white) : color,
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

class _CountdownWidget extends StatefulWidget {
  final DateTime expiry;
  const _CountdownWidget({required this.expiry});

  @override
  State<_CountdownWidget> createState() => _CountdownWidgetState();
}

class _CountdownWidgetState extends State<_CountdownWidget> {
  late Timer _timer;
  late Duration _timeLeft;

  @override
  void initState() {
    super.initState();
    _timeLeft = widget.expiry.difference(DateTime.now());
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _timeLeft = widget.expiry.difference(DateTime.now());
          if (_timeLeft.isNegative) {
            _timer.cancel();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_timeLeft.isNegative) return const SizedBox();
    
    final minutes = _timeLeft.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = _timeLeft.inSeconds.remainder(60).toString().padLeft(2, '0');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, size: 12, color: Colors.red),
          const SizedBox(width: 4),
          Text(
            "$minutes:$seconds",
            style: const TextStyle(
              color: Colors.red,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _ActionButton({
    required this.label,
    required this.color,
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isPrimary ? color : Colors.transparent,
          border: Border.all(color: color),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isPrimary ? Colors.white : color,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isPrimary ? Colors.white : color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

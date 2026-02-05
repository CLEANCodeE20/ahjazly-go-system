import 'package:flutter/material.dart';
import '../../../booking/services/enhanced_booking_service.dart';
import '../screens/trips_page.dart';



// =============================================
// TRIP STATUS BADGE WIDGET
// مكون عرض حالة الرحلة
// =============================================

class TripStatusBadge extends StatelessWidget {
  final String? status;
  final double fontSize;
  final EdgeInsets padding;

  const TripStatusBadge({
    Key? key,
    required this.status,
    this.fontSize = 12,
    this.padding = const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (status == null) return const SizedBox.shrink();

    final config = _getStatusConfig(status!);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: config['color'].withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: config['color'].withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            config['icon'],
            size: fontSize + 2,
            color: config['color'],
          ),
          const SizedBox(width: 6),
          Text(
            config['text'],
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
              color: config['color'],
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return {
          'text': 'مجدولة',
          'color': Colors.blue,
          'icon': Icons.schedule,
        };
      case 'in_progress':
        return {
          'text': 'جارية',
          'color': Colors.orange,
          'icon': Icons.directions_bus,
        };
      case 'completed':
        return {
          'text': 'مكتملة',
          'color': Colors.green,
          'icon': Icons.check_circle,
        };
      case 'cancelled':
        return {
          'text': 'ملغاة',
          'color': Colors.red,
          'icon': Icons.cancel,
        };
      case 'delayed':
        return {
          'text': 'متأخرة',
          'color': Colors.deepOrange,
          'icon': Icons.access_time,
        };
      default:
        return {
          'text': status,
          'color': Colors.grey,
          'icon': Icons.info,
        };
    }
  }
}

// =============================================
// BOOKING ELIGIBILITY CHECKER WIDGET
// مكون التحقق من إمكانية الحجز
// =============================================

class BookingEligibilityChecker extends StatelessWidget {
  final int tripId;
  final Widget Function(BuildContext, bool, String?) builder;

  const BookingEligibilityChecker({
    Key? key,
    required this.tripId,
    required this.builder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _checkEligibility(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        }

        final canBook = snapshot.data?['canBook'] ?? false;
        final message = snapshot.data?['message'] as String?;

        return builder(context, canBook, message);
      },
    );
  }

  Future<Map<String, dynamic>> _checkEligibility() async {
    // استخدام الخدمة المحسّنة
    final service = EnhancedBookingService();
    return await service.canBookTrip(tripId);
  }
}



// =============================================
// TIME UNTIL DEPARTURE WIDGET
// مكون عرض الوقت المتبقي
// =============================================

class TimeUntilDeparture extends StatelessWidget {
  final DateTime departureTime;
  final bool showIcon;

  const TimeUntilDeparture({
    Key? key,
    required this.departureTime,
    this.showIcon = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final difference = departureTime.difference(now);

    if (difference.isNegative) {
      return _buildBadge(
        'انطلقت',
        Colors.grey,
        Icons.check_circle_outline,
      );
    }

    final hours = difference.inHours;
    final minutes = difference.inMinutes % 60;

    String text;
    Color color;
    IconData icon;

    if (hours < 1) {
      if (minutes < 30) {
        text = 'قريباً ($minutes د)';
        color = Colors.red;
        icon = Icons.warning;
      } else {
        text = '$minutes دقيقة';
        color = Colors.orange;
        icon = Icons.access_time;
      }
    } else if (hours < 24) {
      text = '$hours ساعة';
      color = Colors.blue;
      icon = Icons.schedule;
    } else {
      final days = difference.inDays;
      text = '$days يوم';
      color = Colors.green;
      icon = Icons.calendar_today;
    }

    return _buildBadge(text, color, icon);
  }

  Widget _buildBadge(String text, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================
// AVAILABLE SEATS INDICATOR
// مؤشر المقاعد المتاحة
// =============================================

class AvailableSeatsIndicator extends StatelessWidget {
  final int availableSeats;
  final int? totalSeats;
  final bool showPercentage;

  const AvailableSeatsIndicator({
    Key? key,
    required this.availableSeats,
    this.totalSeats,
    this.showPercentage = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    String text;

    if (availableSeats == 0) {
      color = Colors.red;
      icon = Icons.event_busy;
      text = 'مكتمل';
    } else if (availableSeats <= 5) {
      color = Colors.orange;
      icon = Icons.warning_amber;
      text = '$availableSeats مقاعد متبقية';
    } else {
      color = Colors.green;
      icon = Icons.event_seat;
      text = '$availableSeats متاح';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
              fontFamily: 'Cairo',
            ),
          ),
          if (showPercentage && totalSeats != null) ...[
            const SizedBox(width: 4),
            Text(
              '(${((availableSeats / totalSeats!) * 100).toStringAsFixed(0)}%)',
              style: TextStyle(
                fontSize: 10,
                color: color.withOpacity(0.7),
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ],
      ),
    );
  }
}

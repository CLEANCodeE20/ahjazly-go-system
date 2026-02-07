import 'package:flutter/material.dart';
import 'package:get/get.dart';


import '../../../booking/bindings/CreateRatingBinding.dart';
import '../../data/models/user_booking_model.dart';
import '../screens/create_rating_page.dart';

import '../controllers/rating_controller.dart';

// =============================================
// RATE TRIP BUTTON WIDGET
// زر تقييم الرحلة
// =============================================

class RateTripButton extends StatelessWidget {
  final UserBooking booking;
  final VoidCallback? onRated;

  const RateTripButton({
    Key? key,
    required this.booking,
    this.onRated,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // لا يظهر الزر إلا إذا كان الحجز مكتمل ولم يتم التقييم
    if (booking.bookingStatus != 'completed' || booking.hasRating == true) {
      return const SizedBox.shrink();
    }

    return ElevatedButton.icon(
      onPressed: () => _navigateToRating(context),
      icon: const Icon(Icons.star_rate, size: 20),
      label: const Text('قيّم الرحلة'),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFFA000),
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 2,
      ),
    );
  }

  void _navigateToRating(BuildContext context) async {
    final result = await Get.to(
      () => const CreateRatingPage(),
      binding: CreateRatingBinding(),
      arguments: {
        'tripId': booking.tripId,
        'bookingId': booking.bookingId,
        'partnerId': booking.partnerId,
        'driverId': booking.driverId,
        'routeName': booking.originCity ?? 'الرحلة',
      }
    );

    // إذا تم التقييم بنجاح، نفذ callback
    if (result == true && onRated != null) {
      onRated!();
    }
  }
}

// =============================================
// COMPACT RATE TRIP BUTTON
// زر مصغر لتقييم الرحلة
// =============================================

class CompactRateTripButton extends StatelessWidget {
  final UserBooking booking;
  final VoidCallback? onRated;

  const CompactRateTripButton({
    Key? key,
    required this.booking,
    this.onRated,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (booking.bookingStatus != 'completed' || booking.hasRating == true) {
      return const SizedBox.shrink();
    }

    return OutlinedButton.icon(
      onPressed: () => _navigateToRating(context),
      icon: const Icon(Icons.star_border, size: 18),
      label: const Text('تقييم'),
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFFFFA000),
        side: const BorderSide(color: Color(0xFFFFA000)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  void _navigateToRating(BuildContext context) async {
    final result = await Get.to(
      () => const CreateRatingPage(),
      binding: CreateRatingBinding(),
      arguments: {
        'tripId': booking.tripId,
        'bookingId': booking.bookingId,
        'partnerId': booking.partnerId,
        'driverId': booking.driverId,
        'routeName': booking.originCity ?? 'الرحلة',
      }
    );

    if (result == true && onRated != null) {
      onRated!();
    }
  }
}

// =============================================
// RATING PROMPT CARD
// بطاقة تذكير بالتقييم
// =============================================

class RatingPromptCard extends StatelessWidget {
  final UserBooking booking;
  final VoidCallback? onRated;

  const RatingPromptCard({
    Key? key,
    required this.booking,
    this.onRated,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (booking.bookingStatus != 'completed' || booking.hasRating == true) {
      return const SizedBox.shrink();
    }

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFFFFA000).withOpacity(0.1),
              const Color(0xFFFFA000).withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFA000),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.star,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'كيف كانت رحلتك؟',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'شاركنا تجربتك لنحسن خدماتنا',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _navigateToRating(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFA000),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                child: const Text(
                  'قيّم الرحلة الآن',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToRating(BuildContext context) async {
    final result = await Get.to(
      () => const CreateRatingPage(),
      binding: CreateRatingBinding(),
      arguments: {
        'tripId': booking.tripId,
        'bookingId': booking.bookingId,
        'partnerId': booking.partnerId,
        'driverId': booking.driverId,
        'routeName': booking.originCity ?? 'الرحلة',
      }
    );

    if (result == true && onRated != null) {
      onRated!();
    }
  }
}

// =============================================
// RATING STATUS INDICATOR
// مؤشر حالة التقييم
// =============================================

class RatingStatusIndicator extends StatelessWidget {
  final UserBooking booking;

  const RatingStatusIndicator({
    Key? key,
    required this.booking,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (booking.bookingStatus != 'completed') {
      return const SizedBox.shrink();
    }

    if (booking.hasRating == true) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.green.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.check_circle, size: 16, color: Colors.green),
            SizedBox(width: 6),
            Text(
              'تم التقييم',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFFA000).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFA000).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(Icons.star_border, size: 16, color: Color(0xFFFFA000)),
          SizedBox(width: 6),
          Text(
            'في انتظار التقييم',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Color(0xFFFFA000),
            ),
          ),
        ],
      ),
    );
  }
}

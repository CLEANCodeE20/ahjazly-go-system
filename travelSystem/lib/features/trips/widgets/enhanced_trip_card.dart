import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../widgets/trip_status_widgets.dart';

// =============================================
// ENHANCED TRIP CARD
// بطاقة رحلة محسّنة
// =============================================

class EnhancedTripCard extends StatelessWidget {
  final Map<String, dynamic> trip;
  final VoidCallback? onTap;
  final bool showStatus;
  final bool showTimeRemaining;
  final bool showAvailability;

  const EnhancedTripCard({
    Key? key,
    required this.trip,
    this.onTap,
    this.showStatus = true,
    this.showTimeRemaining = true,
    this.showAvailability = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final departureTime = DateTime.parse(trip['departure_time']);
    final availableSeats = trip['available_seats'] as int? ?? 0;
    final tripStatus = trip['trip_status'] as String?;

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Route & Status
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${trip['origin_city']} → ${trip['destination_city']}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          trip['company_name'] ?? 'شركة النقل',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (showStatus && tripStatus != null)
                    TripStatusBadge(status: tripStatus),
                ],
              ),

              const SizedBox(height: 16),

              // Time & Price
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Text(
                    _formatTime(departureTime),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${trip['price_adult']} ر.س',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Badges Row
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (showTimeRemaining)
                    TimeUntilDeparture(departureTime: departureTime),
                  if (showAvailability)
                    AvailableSeatsIndicator(availableSeats: availableSeats),
                ],
              ),

              // Booking Button
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: BookingEligibilityChecker(
                  tripId: trip['trip_id'],
                  builder: (context, canBook, message) {
                    return ElevatedButton(
                      onPressed: canBook ? onTap : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: canBook
                            ? Theme.of(context).primaryColor
                            : Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        canBook ? 'احجز الآن' : message ?? 'غير متاح',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

// =============================================
// BOOKING CONFIRMATION DIALOG
// حوار تأكيد الحجز المحسّن
// =============================================

class BookingConfirmationDialog extends StatelessWidget {
  final Map<String, dynamic> trip;
  final VoidCallback onConfirm;

  const BookingConfirmationDialog({
    Key? key,
    required this.trip,
    required this.onConfirm,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      title: const Text(
        'تأكيد الحجز',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoRow(
            'المسار',
            '${trip['origin_city']} → ${trip['destination_city']}',
            Icons.route,
          ),
          _buildInfoRow(
            'الشركة',
            trip['company_name'],
            Icons.business,
          ),
          _buildInfoRow(
            'الموعد',
            _formatDateTime(DateTime.parse(trip['departure_time'])),
            Icons.calendar_today,
          ),
          _buildInfoRow(
            'السعر',
            '${trip['price_adult']} ر.س',
            Icons.attach_money,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.blue, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'يمكنك الإلغاء حسب سياسة الشركة',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue[700],
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text(
            'إلغاء',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
            onConfirm();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).primaryColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Text(
            'تأكيد الحجز',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontFamily: 'Cairo',
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime time) {
    final months = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر'
    ];
    return '${time.day} ${months[time.month - 1]} ${time.year} - ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}

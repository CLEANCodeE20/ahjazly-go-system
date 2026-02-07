import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../domain/entities/trip_passenger_entity.dart';
import '../../../../core/constants/Color.dart';

class PassengerListItem extends StatelessWidget {
  final TripPassengerEntity passenger;
  final VoidCallback onMarkBoarded;

  const PassengerListItem({
    Key? key,
    required this.passenger,
    required this.onMarkBoarded,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Seat/Status Indicator
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: passenger.isBoarded 
                  ? Colors.green.withOpacity(0.1) 
                  : Colors.grey.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: passenger.isBoarded
                  ? const Icon(Icons.check, color: Colors.green, size: 28)
                  : Text(
                      '${passenger.seatId ?? '-'}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Colors.black87,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 16),
          
          // Passenger Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  passenger.fullName,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87,
                    decoration: passenger.isBoarded ? TextDecoration.lineThrough : null,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.event_seat, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      'مقعد ${passenger.seatId ?? 'غير محدد'}',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          Row(
            children: [
              if (passenger.phoneNumber != null)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.phone, color: Colors.blue, size: 20),
                    onPressed: () => _makePhoneCall(passenger.phoneNumber!),
                    tooltip: 'اتصال',
                  ),
                ),
              if (!passenger.isBoarded)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.check_circle_outline, color: Colors.green, size: 24),
                    onPressed: onMarkBoarded,
                    tooltip: 'تأكيد الصعود',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }
}

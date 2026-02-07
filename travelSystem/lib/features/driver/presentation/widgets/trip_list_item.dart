import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../data/models/driver_trip_model.dart';
import '../../../../core/constants/Color.dart';

class TripListItem extends StatelessWidget {
  final DriverTripModel trip;
  final bool isUpcoming;
  final VoidCallback onTap;

  const TripListItem({
    Key? key,
    required this.trip,
    this.isUpcoming = false,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor().withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.circle, size: 8, color: _getStatusColor()),
                          const SizedBox(width: 6),
                          Text(
                            trip.statusLabel,
                            style: TextStyle(
                              color: _getStatusColor(),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '#${trip.tripId}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[400],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Column(
                      children: [
                        const Icon(Icons.circle, color: Colors.green, size: 12),
                        Container(
                          height: 30,
                          width: 2,
                          color: Colors.grey.withOpacity(0.2),
                        ),
                        const Icon(Icons.location_on, color: Colors.red, size: 12),
                      ],
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            trip.originCity ?? 'غير محدد',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            trip.destinationCity ?? 'غير محدد',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 16, color: AppColor.color_primary),
                            const SizedBox(width: 4),
                            Text(
                              DateFormat('HH:mm').format(trip.departureTime),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColor.color_primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.people, size: 16, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text(
                              '${trip.passengerCount}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                if (isUpcoming) ...[
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Divider(),
                  ),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 14, color: Colors.grey[500]),
                      const SizedBox(width: 8),
                      Text(
                        DateFormat('EEEE، d MMMM yyyy', 'ar').format(trip.departureTime),
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (trip.status) {
      case 'scheduled':
        return Colors.blue;
      case 'in_progress':
        return Colors.green;
      case 'completed':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

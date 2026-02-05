import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/shared/widgets/custom_button_v2.dart';
import '../../shared/widgets/custom_button.dart';
import '../../core/constants/Color.dart';
import '../../features/booking/presentation/screens/BookingWizardPage.dart';
import '../../features/trips/domain/entities/trip_entity.dart';


class BusTripCard extends StatelessWidget {
  final TripEntity trip;
  const BusTripCard({super.key, required this.trip});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorSecondary = theme.textTheme.bodyMedium?.color ?? Colors.grey;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: theme.dividerColor.withOpacity(0.05)),
      ),
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      elevation: 0,
      color: theme.cardTheme.color,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // شريط النوع وVIP
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    trip.companyName,
                    style: TextStyle(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    children: [
                      Text(
                        trip.isVIP ? 'VIP' : 'عادي',
                        style: TextStyle(
                          color: colorSecondary,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.directions_bus, color: theme.colorScheme.primary.withOpacity(0.7), size: 16),
                    ],
                  ),
                ),
                if (trip.linkedTripId != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.link, color: Colors.blue, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'رحلة مترابطة',
                          style: TextStyle(color: Colors.blue, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            // المدن والأوقات
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(trip.cityTo, style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
                    Text(trip.timeTo, style: theme.textTheme.bodyLarge),
                    Text(trip.dateTo, style: theme.textTheme.bodyMedium),
                  ],
                ),
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        height: 1.5,
                        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        color: theme.colorScheme.primary.withOpacity(0.3),
                      ),
                      Text(trip.duration, style: theme.textTheme.bodySmall),
                      Text('رقم الرحلة ${trip.tripNumber}', style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(trip.cityFrom, style: theme.textTheme.titleLarge?.copyWith(fontSize: 18)),
                    Text(trip.timeFrom, style: theme.textTheme.bodyLarge),
                    Text(trip.dateFrom, style: theme.textTheme.bodyMedium),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // المقاعد والخدمات
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                border: Border.symmetric(horizontal: BorderSide(color: theme.dividerColor.withOpacity(0.1))),
              ),
              child: Row(
                children: [
                  Icon(trip.availableSeats > 0 ? Icons.event_seat : Icons.event_seat_outlined, color: colorSecondary, size: 18),
                  const SizedBox(width: 4),
                  Text("${trip.availableSeats} مقعد متوفر", style: theme.textTheme.bodyMedium?.copyWith(color: colorSecondary)),
                  const Spacer(),
                  Icon(Icons.wifi, color: colorSecondary, size: 18),
                  const SizedBox(width: 8),
                  Icon(Icons.shield, color: colorSecondary, size: 18),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // الأسعار
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Text('للأطفال', style: theme.textTheme.bodySmall),
                      Text('${trip.priceChild} SAR', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text('للكبار', style: theme.textTheme.bodySmall),
                      Text('${trip.priceAdult} SAR', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: WidegtBtuoon(
                onPressed: () {
                  Get.to(() => BookingWizardPage(), arguments: trip);
                },
                backgroundColor: theme.colorScheme.primary,
                child: Text(
                  'تفاصيل الرحله'.tr,
                  style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

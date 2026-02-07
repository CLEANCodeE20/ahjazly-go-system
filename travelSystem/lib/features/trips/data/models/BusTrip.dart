import 'package:intl/intl.dart';

class BusTrip {
  final String tripType;        // نوع الرحلة أو فئة الباص (مثال: VIP)
  final String cityFrom;        // مدينة الانطلاق
  final String timeFrom;        // وقت الانطلاق HH:mm
  final String dateFrom;        // تاريخ الانطلاق YYYY-MM-DD
  final String cityTo;          // مدينة الوصول
  final String timeTo;          // وقت الوصول HH:mm
  final String dateTo;          // تاريخ الوصول YYYY-MM-DD
  final String duration;        // مدة الرحلة "X ساعات, Y دقائق"
  final int tripNumber;         // رقم الرحلة
  final int availableSeats;     // المقاعد المتاحة
  final int priceAdult;         // سعر الكبار
  final int priceChild;         // سعر الأطفال
  final bool isVIP;             // هل الرحلة VIP؟
  final String companyName;     // اسم الشركة (اختياري، للعرض أو الفلترة)
  final int busId;              // معرف الحافلة
  final Map<String, dynamic> seatLayout; // تخطيط المقاعد JSON
  final int? linkedTripId;       // معرف الرحلة المترابطة (إن وجد)

  BusTrip({
    required this.tripType,
    required this.cityFrom,
    required this.timeFrom,
    required this.dateFrom,
    required this.cityTo,
    required this.timeTo,
    required this.dateTo,
    required this.duration,
    required this.tripNumber,
    required this.availableSeats,
    required this.priceAdult,
    required this.priceChild,
    required this.isVIP,
    required this.companyName,
    required this.busId,
    required this.seatLayout,
    this.linkedTripId,
  });

  factory BusTrip.fromMap(Map<String, dynamic> row) {
    DateTime dep = DateTime.tryParse(row['departure_time']?.toString() ?? '') ?? DateTime.now();
    DateTime arr = DateTime.tryParse(row['arrival_time']?.toString() ?? '') ?? DateTime.now();

    String duration = "${arr.difference(dep).inHours} ساعات, ${arr.difference(dep).inMinutes % 60} دقائق";

    final timeFormatter = DateFormat('HH:mm');
    final dateFormatter = DateFormat('yyyy-MM-dd');

    return BusTrip(
      tripType: row['bus_class']?.toString() ?? "",
      cityFrom: row['route_from_stop']?.toString() ?? "",
      timeFrom: timeFormatter.format(dep),
      dateFrom: dateFormatter.format(dep),
      cityTo: row['destination_city']?.toString() ?? "",
      timeTo: timeFormatter.format(arr),
      dateTo: dateFormatter.format(arr),
      duration: duration,
      tripNumber: int.tryParse(row['trip_id']?.toString() ?? '0') ?? 0,
      availableSeats: int.tryParse(row['available_seats']?.toString() ?? '0') ?? 0,
      priceAdult: double.tryParse(row['price_adult']?.toString() ?? '0')?.toInt() ?? 0,
      priceChild: double.tryParse(row['price_child']?.toString() ?? '0')?.toInt() ?? 0,
      isVIP: (row['bus_class']?.toString() ?? '') == 'VIP',
      companyName: row['company_name']?.toString() ?? "",
      busId: int.tryParse(row['trip_bus_id']?.toString() ?? '0') ?? 0,
      seatLayout: row['seat_layout'] is Map<String, dynamic> ? row['seat_layout'] : {},
      linkedTripId: row['linked_trip_id'] != null ? int.tryParse(row['linked_trip_id'].toString()) : null,
    );
  }
}






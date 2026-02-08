enum SeatType { standard, premium, taken, table, driver, door, toilet, stairs, empty }

class SeatInfo {
  final int? layoutNumber; // رقم المقعد في التخطيط (1..32) للمقاعد فقط
  final String? code;      // الكود مثل "A1" أو أيقونة تعبيرية
  final SeatType type;

  SeatInfo({
    this.layoutNumber,
    this.code,
    required this.type,
  });
}

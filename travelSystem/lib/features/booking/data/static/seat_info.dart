enum SeatType { standard, premium, taken, table }

class SeatInfo {
  final int? layoutNumber; // رقم المقعد في التخطيط (1..32)
  final String? code;      // الكود مثل "A1"
  final SeatType type;

  SeatInfo({
    required this.layoutNumber,
    required this.code,
    required this.type,
  });
}

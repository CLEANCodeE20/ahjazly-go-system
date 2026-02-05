class TripEntity {
  final String tripType;
  final String cityFrom;
  final String timeFrom;
  final String dateFrom;
  final String cityTo;
  final String timeTo;
  final String dateTo;
  final String duration;
  final int tripNumber;
  final int availableSeats;
  final int priceAdult;
  final int priceChild;
  final bool isVIP;
  final String companyName;
  final int busId;
  final Map<String, dynamic> seatLayout;
  final int? linkedTripId;

  const TripEntity({
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
}

class CancelPreviewEntity {
  final int bookingId;
  final int tripId;
  final double totalPrice;
  final double hoursBeforeDeparture;
  final CancelRuleEntity rule;
  final CalculatedRefundEntity calculated;

  CancelPreviewEntity({
    required this.bookingId,
    required this.tripId,
    required this.totalPrice,
    required this.hoursBeforeDeparture,
    required this.rule,
    required this.calculated,
  });
}

class CancelRuleEntity {
  final int id;
  final double minHours;
  final double? maxHours;
  final double refundPercentage;
  final double cancellationFee;

  CancelRuleEntity({
    required this.id,
    required this.minHours,
    this.maxHours,
    required this.refundPercentage,
    required this.cancellationFee,
  });
}

class CalculatedRefundEntity {
  final double refundAmount;
  final double nonRefundablePart;

  CalculatedRefundEntity({
    required this.refundAmount,
    required this.nonRefundablePart,
  });
}

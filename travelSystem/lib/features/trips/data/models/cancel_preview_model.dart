class CancelPreviewModel {
  final int bookingId;
  final int tripId;
  final double totalPrice;
  final double hoursBeforeDeparture;
  final CancelRule rule;
  final CalculatedRefund calculated;

  CancelPreviewModel({
    required this.bookingId,
    required this.tripId,
    required this.totalPrice,
    required this.hoursBeforeDeparture,
    required this.rule,
    required this.calculated,
  });

  factory CancelPreviewModel.fromJson(Map<String, dynamic> json) {
    return CancelPreviewModel(
      bookingId: json['booking_id'] ?? 0,
      tripId: json['trip_id'] ?? 0,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0.0,
      hoursBeforeDeparture: (json['hours_before_departure'] as num?)?.toDouble() ?? 0.0,
      rule: CancelRule.fromJson(json['rule'] ?? {}),
      calculated: CalculatedRefund.fromJson(json['calculated'] ?? {}),
    );
  }
}

class CancelRule {
  final int id;
  final double minHours;
  final double? maxHours;
  final double refundPercentage;
  final double cancellationFee;

  CancelRule({
    required this.id,
    required this.minHours,
    this.maxHours,
    required this.refundPercentage,
    required this.cancellationFee,
  });

  factory CancelRule.fromJson(Map<String, dynamic> json) {
    return CancelRule(
      id: json['cancel_policy_rule_id'] ?? 0,
      minHours: (json['min_hours_before_departure'] as num?)?.toDouble() ?? 0.0,
      maxHours: (json['max_hours_before_departure'] as num?)?.toDouble(),
      refundPercentage: (json['refund_percentage'] as num?)?.toDouble() ?? 0.0,
      cancellationFee: (json['cancellation_fee'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class CalculatedRefund {
  final double refundAmount;
  final double nonRefundablePart;

  CalculatedRefund({
    required this.refundAmount,
    required this.nonRefundablePart,
  });

  factory CalculatedRefund.fromJson(Map<String, dynamic> json) {
    return CalculatedRefund(
      refundAmount: (json['refund_amount'] as num?)?.toDouble() ?? 0.0,
      nonRefundablePart: (json['non_refundable_part'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

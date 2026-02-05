import 'package:equatable/equatable.dart';

class CancellationPolicyRuleEntity extends Equatable {
  final int ruleId;
  final int? minHoursBeforeDeparture;
  final int? maxHoursBeforeDeparture;
  final int refundPercentage;
  final double cancellationFee;
  final int displayOrder;
  final bool isActive;

  const CancellationPolicyRuleEntity({
    required this.ruleId,
    this.minHoursBeforeDeparture,
    this.maxHoursBeforeDeparture,
    required this.refundPercentage,
    required this.cancellationFee,
    required this.displayOrder,
    required this.isActive,
  });

  @override
  List<Object?> get props => [
        ruleId,
        minHoursBeforeDeparture,
        maxHoursBeforeDeparture,
        refundPercentage,
        cancellationFee,
        displayOrder,
        isActive,
      ];
}

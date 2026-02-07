import '../../domain/entities/cancellation_policy_rule_entity.dart';

class CancellationPolicyRuleModel extends CancellationPolicyRuleEntity {
  const CancellationPolicyRuleModel({
    required super.ruleId,
    super.minHoursBeforeDeparture,
    super.maxHoursBeforeDeparture,
    required super.refundPercentage,
    required super.cancellationFee,
    required super.displayOrder,
    required super.isActive,
  });

  factory CancellationPolicyRuleModel.fromJson(Map<String, dynamic> json) {
    return CancellationPolicyRuleModel(
      ruleId: json['rule_id'] as int,
      minHoursBeforeDeparture: json['min_hours_before_departure'] != null 
          ? (json['min_hours_before_departure'] as num).toInt() 
          : null,
      maxHoursBeforeDeparture: json['max_hours_before_departure'] != null 
          ? (json['max_hours_before_departure'] as num).toInt() 
          : null,
      refundPercentage: (json['refund_percentage'] as num? ?? 0).toInt(),
      cancellationFee: (json['cancellation_fee'] as num? ?? 0.0).toDouble(),
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  CancellationPolicyRuleEntity toEntity() {
    return CancellationPolicyRuleEntity(
      ruleId: ruleId,
      minHoursBeforeDeparture: minHoursBeforeDeparture,
      maxHoursBeforeDeparture: maxHoursBeforeDeparture,
      refundPercentage: refundPercentage,
      cancellationFee: cancellationFee,
      displayOrder: displayOrder,
      isActive: isActive,
    );
  }
}

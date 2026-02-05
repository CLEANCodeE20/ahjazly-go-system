import '../../domain/entities/cancellation_policy_entity.dart';
import 'cancellation_policy_rule_model.dart';

/// Model class for cancellation policy data
class CancellationPolicyModel extends CancellationPolicyEntity {
  const CancellationPolicyModel({
    required super.policyId,
    super.partnerId,
    super.partnerName,
    required super.policyName,
    super.description,
    required super.refundPercentage,
    required super.daysBeforeTrip,
    super.rules,
    required super.isActive,
  });

  /// Create model from JSON
  factory CancellationPolicyModel.fromJson(Map<String, dynamic> json) {
    return CancellationPolicyModel(
      policyId: json['cancel_policy_id'] as int,
      partnerId: json['partner_id'] as int?,
      partnerName: json['partners'] != null ? json['partners']['company_name'] as String? : null,
      policyName: json['policy_name'] as String,
      description: json['description'] as String?,
      refundPercentage: (json['refund_percentage'] as num? ?? 0).toInt(),
      daysBeforeTrip: (json['days_before_trip'] as num? ?? 0).toInt(),
      isActive: json['is_active'] as bool? ?? true,
      rules: json['cancel_policy_rules'] != null
          ? (json['cancel_policy_rules'] as List)
              .map((ruleJson) => CancellationPolicyRuleModel.fromJson(ruleJson))
              .toList()
          : null,
    );
  }

  /// Convert model to JSON
  Map<String, dynamic> toJson() {
    return {
      'cancel_policy_id': policyId,
      'partner_id': partnerId,
      'policy_name': policyName,
      if (description != null) 'description': description,
      'refund_percentage': refundPercentage,
      'days_before_trip': daysBeforeTrip,
      'is_active': isActive,
    };
  }

  /// Convert model to entity
  CancellationPolicyEntity toEntity() {
    return CancellationPolicyEntity(
      policyId: policyId,
      partnerId: partnerId,
      partnerName: partnerName,
      policyName: policyName,
      description: description,
      refundPercentage: refundPercentage,
      daysBeforeTrip: daysBeforeTrip,
      rules: rules?.map((rule) => (rule as CancellationPolicyRuleModel).toEntity()).toList(),
      isActive: isActive,
    );
  }
}

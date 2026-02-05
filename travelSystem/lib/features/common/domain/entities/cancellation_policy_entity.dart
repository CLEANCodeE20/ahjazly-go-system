

import 'package:equatable/equatable.dart';
import 'cancellation_policy_rule_entity.dart';

/// Entity representing a cancellation policy
class CancellationPolicyEntity extends Equatable {
  final int policyId;
  final int? partnerId;
  final String? partnerName;
  final String policyName;
  final String? description;
  final int refundPercentage;
  final int daysBeforeTrip;
  final List<CancellationPolicyRuleEntity>? rules;
  final bool isActive;

  const CancellationPolicyEntity({
    required this.policyId,
    this.partnerId,
    this.partnerName,
    required this.policyName,
    this.description,
    required this.refundPercentage,
    required this.daysBeforeTrip,
    this.rules,
    required this.isActive,
  });

  @override
  List<Object?> get props => [
        policyId,
        partnerId,
        partnerName,
        policyName,
        description,
        refundPercentage,
        daysBeforeTrip,
        rules,
        isActive,
      ];
}

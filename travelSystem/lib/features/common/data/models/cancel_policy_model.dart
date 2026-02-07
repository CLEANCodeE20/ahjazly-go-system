// lib/features/profile/data/models/cancel_policy_model.dart

class CancelPolicyRule {
  final int id;
  final int hoursBeforeTrip;
  final double refundPercentage;

  CancelPolicyRule({
    required this.id,
    required this.hoursBeforeTrip,
    required this.refundPercentage,
  });

  factory CancelPolicyRule.fromJson(Map<String, dynamic> json) {
    return CancelPolicyRule(
      id: json['rule_id'] ?? 0,
      hoursBeforeTrip: json['hours_before_trip'] ?? 0,
      refundPercentage: (json['refund_percentage'] as num? ?? 0).toDouble(),
    );
  }
}

class CancelPolicy {
  final int id;
  final String title;
  final String description;
  final double? refundPercentage;
  final int? daysBeforeTrip;
  final List<CancelPolicyRule>? rules;

  CancelPolicy({
    required this.id,
    required this.title,
    required this.description,
    this.refundPercentage,
    this.daysBeforeTrip,
    this.rules,
  });
}

class CompanyCancelPolicies {
  final int companyId;
  final String companyName;
  final List<CancelPolicy> policies;

  CompanyCancelPolicies({
    required this.companyId,
    required this.companyName,
    required this.policies,
  });
}

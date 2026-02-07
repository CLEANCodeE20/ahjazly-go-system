

import '../../domain/entities/partner_entity.dart';

class PartnerModel extends PartnerEntity {
  PartnerModel({
    required super.companyName,
    super.logoUrl,
  });

  factory PartnerModel.fromJson(Map<String, dynamic> json) {
    return PartnerModel(
      companyName: json['company_name'] as String? ?? 'Unknown',
      logoUrl: json['logo_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'company_name': companyName,
      'logo_url': logoUrl,
    };
  }
}

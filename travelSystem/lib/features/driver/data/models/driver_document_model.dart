

import '../../domain/entities/driver_document_entity.dart';

class DriverDocumentModel extends DriverDocumentEntity {
  DriverDocumentModel({
    required super.documentId,
    required super.driverId,
    required super.documentType,
    required super.documentUrl,
    required super.documentName,
    super.expiryDate,
    required super.verificationStatus,
  });

  factory DriverDocumentModel.fromJson(Map<String, dynamic> json) {
    return DriverDocumentModel(
      documentId: json['document_id'] as int,
      driverId: json['driver_id'] as int,
      documentType: json['document_type'] as String? ?? 'identity',
      documentUrl: json['document_url'] as String? ?? '',
      documentName: json['document_name'] as String? ?? '',
      expiryDate: json['expiry_date'] as String?,
      verificationStatus: json['verification_status'] as String? ?? 'pending',
    );
  }
}

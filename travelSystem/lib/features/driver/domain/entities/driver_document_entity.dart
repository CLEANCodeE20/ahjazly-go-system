class DriverDocumentEntity {
  final int documentId;
  final int driverId;
  final String documentType;
  final String documentUrl;
  final String documentName;
  final String? expiryDate;
  final String verificationStatus;

  DriverDocumentEntity({
    required this.documentId,
    required this.driverId,
    required this.documentType,
    required this.documentUrl,
    required this.documentName,
    this.expiryDate,
    required this.verificationStatus,
  });
}

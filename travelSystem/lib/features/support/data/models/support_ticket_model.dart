import '../../domain/entities/support_ticket_entity.dart';

/// Model class for support ticket data
class SupportTicketModel extends SupportTicketEntity {
  const SupportTicketModel({
    super.ticketId,
    required super.userId,
    required super.subject,
    required super.description,
    required super.status,
    required super.priority,
    super.category,
    required super.createdAt,
    super.updatedAt,
    super.resolvedAt,
  });

  /// Create model from JSON
  factory SupportTicketModel.fromJson(Map<String, dynamic> json) {
    return SupportTicketModel(
      ticketId: json['ticket_id'] as int?,
      userId: json['user_id'].toString(),
      subject: (json['title'] ?? json['subject']) as String,
      description: json['description'] as String,
      status: json['status'] as String? ?? 'open',
      priority: json['priority'] as String? ?? 'medium',
      category: (json['issue_type'] ?? json['category']) as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      resolvedAt: json['resolved_at'] != null
          ? DateTime.parse(json['resolved_at'] as String)
          : null,
    );
  }

  /// Convert model to JSON
  Map<String, dynamic> toJson() {
    return {
      if (ticketId != null) 'ticket_id': ticketId,
      'user_id': int.tryParse(userId) ?? userId,
      'title': subject,
      'description': description,
      'status': status,
      'priority': priority,
      if (category != null) 'issue_type': category,
      'created_at': createdAt.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
      if (resolvedAt != null) 'resolved_at': resolvedAt!.toIso8601String(),
    };
  }

  /// Convert entity to model
  factory SupportTicketModel.fromEntity(SupportTicketEntity entity) {
    return SupportTicketModel(
      ticketId: entity.ticketId,
      userId: entity.userId,
      subject: entity.subject,
      description: entity.description,
      status: entity.status,
      priority: entity.priority,
      category: entity.category,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      resolvedAt: entity.resolvedAt,
    );
  }

  /// Convert model to entity
  SupportTicketEntity toEntity() {
    return SupportTicketEntity(
      ticketId: ticketId,
      userId: userId,
      subject: subject,
      description: description,
      status: status,
      priority: priority,
      category: category,
      createdAt: createdAt,
      updatedAt: updatedAt,
      resolvedAt: resolvedAt,
    );
  }
}

import 'package:equatable/equatable.dart';

/// Entity representing a support ticket
class SupportTicketEntity extends Equatable {
  final int? ticketId;
  final String userId;
  final String subject;
  final String description;
  final String status; // 'open', 'in_progress', 'resolved', 'closed'
  final String priority; // 'low', 'medium', 'high', 'urgent'
  final String? category;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? resolvedAt;

  const SupportTicketEntity({
    this.ticketId,
    required this.userId,
    required this.subject,
    required this.description,
    required this.status,
    required this.priority,
    this.category,
    required this.createdAt,
    this.updatedAt,
    this.resolvedAt,
  });

  @override
  List<Object?> get props => [
        ticketId,
        userId,
        subject,
        description,
        status,
        priority,
        category,
        createdAt,
        updatedAt,
        resolvedAt,
      ];

  SupportTicketEntity copyWith({
    int? ticketId,
    String? userId,
    String? subject,
    String? description,
    String? status,
    String? priority,
    String? category,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? resolvedAt,
  }) {
    return SupportTicketEntity(
      ticketId: ticketId ?? this.ticketId,
      userId: userId ?? this.userId,
      subject: subject ?? this.subject,
      description: description ?? this.description,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      category: category ?? this.category,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
    );
  }
}

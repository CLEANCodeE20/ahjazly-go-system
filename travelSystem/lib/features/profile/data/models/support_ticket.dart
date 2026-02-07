class SupportTicket {
  final int ticketId;
  final String userId;
  final String issueType;
  final String title;
  final String description;
  final String status;
  final String priority;
  final DateTime createdAt;

  SupportTicket({
    required this.ticketId,
    required this.userId,
    required this.issueType,
    required this.title,
    required this.description,
    required this.status,
    required this.priority,
    required this.createdAt,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    int _toInt(dynamic v) {
      if (v is int) return v;
      if (v is String) return int.tryParse(v) ?? 0;
      if (v is num) return v.toInt();
      return 0;
    }

    return SupportTicket(
      ticketId: _toInt(json['ticket_id']),
      userId: json['auth_id']?.toString() ?? json['user_id']?.toString() ?? '',
      issueType: json['issue_type']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Open',
      priority: json['priority']?.toString() ?? 'Normal',
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'].toString()) 
          : DateTime.now(),
    );
  }
}

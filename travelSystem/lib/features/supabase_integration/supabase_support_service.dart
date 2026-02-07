import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase/supabase_service.dart';
import '../profile/data/models/support_ticket.dart';

class SupabaseSupportService extends GetxService {
  final SupabaseClient _client = SupabaseService.to;

  Future<List<SupportTicket>> fetchMyTickets(String userId) async {
    final response = await _client
        .from('support_tickets')
        .select()
        .eq('auth_id', userId)
        .order('created_at', ascending: false);

    return (response as List).map((e) => SupportTicket.fromJson(e)).toList();
  }

  Future<void> createTicket({
    required String userId,
    required String title,
    required String description,
    required String issueType,
    String priority = 'Normal',
  }) async {
    await _client.from('support_tickets').insert({
      'auth_id': userId,
      'title': title,
      'description': description,
      'issue_type': issueType,
      'priority': priority,
      'status': 'open',
    });
  }
}

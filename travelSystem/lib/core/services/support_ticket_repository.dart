import 'package:get/get.dart';
import '../../features/profile/data/models/support_ticket.dart';
import '../../features/supabase_integration/supabase_support_service.dart';

class SupportTicketRepository {
  final SupabaseSupportService _supabaseSupport = Get.find<SupabaseSupportService>();

  Future<List<SupportTicket>> fetchMyTickets(int userId) async {
    try {
      return await _supabaseSupport.fetchMyTickets(userId);
    } catch (e) {
      throw Exception('فشل جلب تذاكر الدعم: $e');
    }
  }

  Future<SupportTicket> createTicket({
    required int userId,
    required String issueType,
    required String title,
    required String description,
  }) async {
    try {
      await _supabaseSupport.createTicket(
        userId: userId,
        title: title,
        description: description,
        issueType: issueType,
      );
      
      // Return a dummy object for compatibility or fetch the last one
      return SupportTicket(
        ticketId: 0,
        userId: userId,
        issueType: issueType,
        title: title,
        description: description,
        status: 'open',
        priority: 'Normal',
        createdAt: DateTime.now(),
      );
    } catch (e) {
      throw Exception('فشل إنشاء التذكرة: $e');
    }
  }
}

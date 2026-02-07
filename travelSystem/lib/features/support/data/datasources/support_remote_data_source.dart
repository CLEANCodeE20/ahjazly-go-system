import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/support_ticket_model.dart';

/// Abstract class for support remote data source
abstract class SupportRemoteDataSource {
  Future<SupportTicketModel> createTicket(SupportTicketModel ticket);
  Future<List<SupportTicketModel>> getUserTickets(String userId);
  Future<SupportTicketModel> getTicketDetails(int ticketId);
}

/// Implementation of support remote data source using Supabase
class SupportRemoteDataSourceImpl implements SupportRemoteDataSource {
  final SupabaseClient supabaseClient;

  SupportRemoteDataSourceImpl(this.supabaseClient);

  @override
  Future<SupportTicketModel> createTicket(SupportTicketModel ticket) async {
    try {
      final response = await supabaseClient
          .from('support_tickets')
          .insert(ticket.toJson())
          .select()
          .single();

      return SupportTicketModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create support ticket: $e');
    }
  }

  @override
  Future<List<SupportTicketModel>> getUserTickets(String userId) async {
    try {
      final response = await supabaseClient
          .from('support_tickets')
          .select()
          .eq('auth_id', userId) // Updated to auth_id
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => SupportTicketModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to get user tickets: $e');
    }
  }

  @override
  Future<SupportTicketModel> getTicketDetails(int ticketId) async {
    try {
      final response = await supabaseClient
          .from('support_tickets')
          .select()
          .eq('ticket_id', ticketId)
          .single();

      return SupportTicketModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get ticket details: $e');
    }
  }
}

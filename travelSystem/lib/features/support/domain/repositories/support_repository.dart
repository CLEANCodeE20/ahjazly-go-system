import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/support_ticket_entity.dart';

/// Repository interface for support-related operations
abstract class SupportRepository {
  /// Create a new support ticket
  Future<Either<Failure, SupportTicketEntity>> createTicket(
    SupportTicketEntity ticket,
  );

  /// Get all tickets for a user
  Future<Either<Failure, List<SupportTicketEntity>>> getUserTickets(
    String userId,
  );

  /// Get ticket details by ID
  Future<Either<Failure, SupportTicketEntity>> getTicketDetails(
    int ticketId,
  );
}

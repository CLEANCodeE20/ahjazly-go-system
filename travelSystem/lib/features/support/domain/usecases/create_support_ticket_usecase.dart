import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/support_ticket_entity.dart';
import '../repositories/support_repository.dart';

/// Use case for creating a support ticket
class CreateSupportTicketUseCase implements UseCase<SupportTicketEntity, SupportTicketEntity> {
  final SupportRepository repository;

  CreateSupportTicketUseCase(this.repository);

  @override
  Future<Either<Failure, SupportTicketEntity>> call(SupportTicketEntity ticket) async {
    return await repository.createTicket(ticket);
  }
}

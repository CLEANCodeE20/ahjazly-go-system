import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';

import '../entities/support_ticket_entity.dart';
import '../repositories/support_repository.dart';

/// Use case for getting user tickets
class GetUserTicketsUseCase implements UseCase<List<SupportTicketEntity>, String> {
  final SupportRepository repository;

  GetUserTicketsUseCase(this.repository);

  @override
  Future<Either<Failure, List<SupportTicketEntity>>> call(String userId) async {
    return await repository.getUserTickets(userId);
  }
}

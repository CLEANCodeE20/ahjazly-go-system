import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/support_ticket_entity.dart';
import '../repositories/support_repository.dart';

/// Use case for getting ticket details
class GetTicketDetailsUseCase implements UseCase<SupportTicketEntity, int> {
  final SupportRepository repository;

  GetTicketDetailsUseCase(this.repository);

  @override
  Future<Either<Failure, SupportTicketEntity>> call(int ticketId) async {
    return await repository.getTicketDetails(ticketId);
  }
}

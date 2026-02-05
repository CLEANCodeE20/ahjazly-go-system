import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/support_ticket_entity.dart';
import '../../domain/repositories/support_repository.dart';
import '../datasources/support_remote_data_source.dart';
import '../models/support_ticket_model.dart';

/// Implementation of SupportRepository
class SupportRepositoryImpl implements SupportRepository {
  final SupportRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  SupportRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, SupportTicketEntity>> createTicket(
    SupportTicketEntity ticket,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final ticketModel = SupportTicketModel.fromEntity(ticket);
      final createdTicket = await remoteDataSource.createTicket(ticketModel);
      return Right(createdTicket.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<SupportTicketEntity>>> getUserTickets(
    String userId,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final tickets = await remoteDataSource.getUserTickets(userId);
      return Right(tickets.map((model) => model.toEntity()).toList());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, SupportTicketEntity>> getTicketDetails(
    int ticketId,
  ) async {
    if (!await networkInfo.isConnected) {
      return Left(OfflineFailure('No Internet Connection'));
    }

    try {
      final ticket = await remoteDataSource.getTicketDetails(ticketId);
      return Right(ticket.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}

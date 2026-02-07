import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/booking_repository.dart';

class UpdatePaymentStatusUseCase implements UseCase<void, UpdatePaymentParams> {
  final BookingRepository repository;

  UpdatePaymentStatusUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(UpdatePaymentParams params) async {
    // We might need to add this to repository interface first
    return await repository.updatePaymentStatus(
      bookingId: params.bookingId,
      status: params.status,
      method: params.method,
      transactionId: params.transactionId,
    );
  }
}

class UpdatePaymentParams {
  final int bookingId;
  final String status;
  final String method;
  final String? transactionId;

  UpdatePaymentParams({
    required this.bookingId,
    required this.status,
    required this.method,
    this.transactionId,
  });
}

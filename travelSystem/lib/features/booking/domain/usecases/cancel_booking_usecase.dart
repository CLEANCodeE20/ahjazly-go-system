import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/booking_repository.dart';
import '../entities/cancel_preview_entity.dart';

class CancelBookingUseCase implements UseCase<CancelPreviewEntity, CancelBookingParams> {
  final BookingRepository repository;

  CancelBookingUseCase(this.repository);

  @override
  Future<Either<Failure, CancelPreviewEntity>> call(CancelBookingParams params) async {
    return await repository.cancelBooking(
      params.bookingId,
      reason: params.reason,
      confirm: params.confirm,
    );
  }
}

class CancelBookingParams {
  final int bookingId;
  final String? reason;
  final bool confirm;

  CancelBookingParams({
    required this.bookingId,
    this.reason,
    this.confirm = false,
  });
}

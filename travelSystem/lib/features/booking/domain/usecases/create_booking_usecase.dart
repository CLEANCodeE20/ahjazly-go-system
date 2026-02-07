import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/booking_entity.dart';
import '../repositories/booking_repository.dart';
import './create_booking_params.dart';

class CreateBookingUseCase implements UseCase<BookingEntity, CreateBookingParams> {
  final BookingRepository repository;

  CreateBookingUseCase(this.repository);

  @override
  Future<Either<Failure, BookingEntity>> call(CreateBookingParams params) async {
    return await repository.createBooking(params);
  }
}

import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/booking_repository.dart';

class GetAvailableSeatsUseCase implements UseCase<Map<String, dynamic>, int> {
  final BookingRepository repository;

  GetAvailableSeatsUseCase(this.repository);

  @override
  Future<Either<Failure, Map<String, dynamic>>> call(int tripId) async {
    return await repository.getAvailableSeats(tripId);
  }
}

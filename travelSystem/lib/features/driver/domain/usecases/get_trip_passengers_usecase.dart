import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/trip_passenger_entity.dart';
import '../repositories/driver_repository.dart';

class GetTripPassengersUseCase implements UseCase<List<TripPassengerEntity>, int> {
  final DriverRepository repository;

  GetTripPassengersUseCase(this.repository);

  @override
  Future<Either<Failure, List<TripPassengerEntity>>> call(int tripId) async {
    return await repository.getTripPassengers(tripId);
  }
}

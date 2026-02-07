import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/driver_trip_entity.dart';
import '../repositories/driver_repository.dart';

class GetDriverTripsUseCase implements UseCase<List<DriverTripEntity>, DriverTripsParams> {
  final DriverRepository repository;

  GetDriverTripsUseCase(this.repository);

  @override
  Future<Either<Failure, List<DriverTripEntity>>> call(DriverTripsParams params) async {
    return await repository.getDriverTrips(
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
    );
  }
}

class DriverTripsParams {
  final DateTime startDate;
  final DateTime endDate;
  final String? status;

  DriverTripsParams({
    required this.startDate,
    required this.endDate,
    this.status,
  });
}

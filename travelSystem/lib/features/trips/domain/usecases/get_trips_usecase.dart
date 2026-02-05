import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/trip_entity.dart';
import '../repositories/trips_repository.dart';

class GetTripsUseCase implements UseCase<List<TripEntity>, GetTripsParams> {
  final TripsRepository repository;

  GetTripsUseCase(this.repository);

  @override
  Future<Either<Failure, List<TripEntity>>> call(GetTripsParams params) async {
    return await repository.getTrips(
      cityFrom: params.cityFrom,
      cityTo: params.cityTo,
      date: params.date,
      busClass: params.busClass,
    );
  }
}

class GetTripsParams {
  final String cityFrom;
  final String cityTo;
  final String date;
  final String? busClass;

  GetTripsParams({
    required this.cityFrom,
    required this.cityTo,
    required this.date,
    this.busClass,
  });
}

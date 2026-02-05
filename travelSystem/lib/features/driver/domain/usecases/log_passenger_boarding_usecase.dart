import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/driver_repository.dart';

class LogPassengerBoardingUseCase implements UseCase<Map<String, dynamic>, LogPassengerBoardingParams> {
  final DriverRepository repository;

  LogPassengerBoardingUseCase(this.repository);

  @override
  Future<Either<Failure, Map<String, dynamic>>> call(LogPassengerBoardingParams params) async {
    return await repository.logPassengerBoarding(
      passengerId: params.passengerId,
      tripId: params.tripId,
      boardingMethod: params.boardingMethod,
      locationLat: params.locationLat,
      locationLng: params.locationLng,
      notes: params.notes,
    );
  }
}

class LogPassengerBoardingParams {
  final int passengerId;
  final int tripId;
  final String boardingMethod;
  final double? locationLat;
  final double? locationLng;
  final String? notes;

  LogPassengerBoardingParams({
    required this.passengerId,
    required this.tripId,
    this.boardingMethod = 'manual',
    this.locationLat,
    this.locationLng,
    this.notes,
  });
}

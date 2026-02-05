import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/driver_repository.dart';

class UpdateTripStatusUseCase implements UseCase<Map<String, dynamic>, UpdateTripStatusParams> {
  final DriverRepository repository;

  UpdateTripStatusUseCase(this.repository);

  @override
  Future<Either<Failure, Map<String, dynamic>>> call(UpdateTripStatusParams params) async {
    return await repository.updateTripStatus(
      tripId: params.tripId,
      newStatus: params.newStatus,
      locationLat: params.locationLat,
      locationLng: params.locationLng,
      notes: params.notes,
    );
  }
}

class UpdateTripStatusParams {
  final int tripId;
  final String newStatus;
  final double? locationLat;
  final double? locationLng;
  final String? notes;

  UpdateTripStatusParams({
    required this.tripId,
    required this.newStatus,
    this.locationLat,
    this.locationLng,
    this.notes,
  });
}

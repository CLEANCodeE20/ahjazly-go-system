import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/trips_repository.dart';

class AddPartnerResponseUseCase {
  final TripsRepository repository;

  AddPartnerResponseUseCase(this.repository);

  Future<Either<Failure, bool>> call({
    required int ratingId,
    required String responseText,
  }) async {
    return await repository.addPartnerResponse(
      ratingId: ratingId,
      responseText: responseText,
    );
  }
}

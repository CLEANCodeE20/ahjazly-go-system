import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/faq_entity.dart';
import '../entities/cancellation_policy_entity.dart';
import '../entities/city_entity.dart';

/// Repository interface for common services
abstract class CommonRepository {
  /// Get all FAQs
  Future<Either<Failure, List<FAQEntity>>> getFAQs();

  /// Get cancellation policies
  Future<Either<Failure, List<CancellationPolicyEntity>>> getCancellationPolicies();

  /// Get all active cities
  Future<Either<Failure, List<CityEntity>>> getCities();
}

import 'package:dartz/dartz.dart';
import '../../../../core/data/base_cached_repository.dart';
import '../../../../core/data/cache_strategy.dart';
import '../../../../core/data/offline_data_state.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../../../core/services/cache_service.dart';
import '../../domain/entities/faq_entity.dart';
import '../../domain/entities/cancellation_policy_entity.dart';
import '../../domain/entities/city_entity.dart';
import '../../domain/repositories/common_repository.dart';
import '../datasources/common_remote_data_source.dart';
import '../models/faq_model.dart';
import '../models/cancellation_policy_model.dart';
import '../models/city_model.dart';

/// Implementation of CommonRepository with caching support
class CommonRepositoryImpl extends BaseCachedRepository implements CommonRepository {
  final CommonRemoteDataSource remoteDataSource;

  CommonRepositoryImpl({
    required this.remoteDataSource,
    required NetworkInfo networkInfo,
    required CacheService cacheService,
  }) : super(
          networkInfo: networkInfo,
          cacheService: cacheService,
        );

  @override
  Future<Either<Failure, List<FAQEntity>>> getFAQs() async {
    final result = await getCachedData<List<FAQEntity>>(
      cacheKey: 'common_faqs',
      fetchFromRemote: () async {
        final models = await remoteDataSource.getFAQs();
        return models.map((model) => model.toEntity()).toList();
      },
      fromJson: (json) {
        return (json as List)
            .map((item) => FAQModel.fromJson(item).toEntity())
            .toList();
      },
      toJson: (data) {
        return data.map((entity) {
          return {
            'faq_id': entity.faqId,
            'question': entity.question,
            'answer': entity.answer,
            if (entity.category != null) 'category': entity.category,
            'display_order': entity.displayOrder,
            'is_active': entity.isActive,
            'created_at': entity.createdAt.toIso8601String(),
          };
        }).toList();
      },
      config: CacheConfig.staticData, // 24 hours cache for FAQs
    );

    return result.fold(
      (failure) => Left(failure),
      (dataState) => Right(dataState.data),
    );
  }

  @override
  Future<Either<Failure, List<CancellationPolicyEntity>>> getCancellationPolicies() async {
    final result = await getCachedData<List<CancellationPolicyEntity>>(
      cacheKey: 'common_cancellation_policies',
      fetchFromRemote: () async {
        final models = await remoteDataSource.getCancellationPolicies();
        return models.map((model) => model.toEntity()).toList();
      },
      fromJson: (json) {
        return (json as List)
            .map((item) => CancellationPolicyModel.fromJson(item).toEntity())
            .toList();
      },
      toJson: (data) {
        return data.map((entity) {
          return {
            'cancel_policy_id': entity.policyId,
            'partner_id': entity.partnerId,
            'policy_name': entity.policyName,
            if (entity.description != null) 'description': entity.description,
            'refund_percentage': entity.refundPercentage,
            'days_before_trip': entity.daysBeforeTrip,
            'is_active': entity.isActive,
          };
        }).toList();
      },
      config: CacheConfig.staticData, // 24 hours cache for policies
    );

    return result.fold(
      (failure) => Left(failure),
      (dataState) => Right(dataState.data),
    );
  }

  @override
  Future<Either<Failure, List<CityEntity>>> getCities() async {
    final result = await getCachedData<List<CityEntity>>(
      cacheKey: 'common_cities',
      fetchFromRemote: () async {
        final models = await remoteDataSource.getCities();
        return models.map((model) => model.toEntity()).toList();
      },
      fromJson: (json) {
        return (json as List)
            .map((item) => CityModel.fromJson(item).toEntity())
            .toList();
      },
      toJson: (data) {
        return data.map((entity) {
          return {
            'city_id': entity.cityId,
            'city_name': entity.cityName,
            'arabic_name': entity.arabicName,
            'is_active': entity.isActive,
          };
        }).toList();
      },
      config: CacheConfig.mediumData, // 1 hour cache for cities
    );

    return result.fold(
      (failure) => Left(failure),
      (dataState) => Right(dataState.data),
    );
  }
}

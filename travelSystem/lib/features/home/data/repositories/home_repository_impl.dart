import 'package:dartz/dartz.dart';
import '../../../../core/data/base_cached_repository.dart';
import '../../../../core/data/cache_strategy.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/network_info.dart';
import '../../../../core/services/cache_service.dart';
import '../../domain/entities/banner_entity.dart';
import '../../domain/entities/partner_entity.dart';
import '../../domain/repositories/home_repository.dart';
import '../datasources/home_remote_data_source.dart';
import '../models/banner_model.dart';
import '../models/partner_model.dart';

class HomeRepositoryImpl extends BaseCachedRepository implements HomeRepository {
  final HomeRemoteDataSource remoteDataSource;

  HomeRepositoryImpl({
    required this.remoteDataSource,
    required NetworkInfo networkInfo,
    required CacheService cacheService,
  }) : super(
          networkInfo: networkInfo,
          cacheService: cacheService,
        );

  @override
  Future<Either<Failure, List<BannerEntity>>> getBanners() async {
    final result = await getCachedData<List<BannerEntity>>(
      cacheKey: 'home_banners',
      fetchFromRemote: () async {
        final models = await remoteDataSource.getBanners();
        return models;
      },
      fromJson: (json) {
        return (json as List)
            .map((item) => BannerModel.fromJson(item))
            .toList();
      },
      toJson: (data) {
        return data.map((entity) {
          return {
            'id': entity.id,
            'title': entity.title,
            'image_url': entity.imageUrl,
            'target_url': entity.targetUrl,
            'display_order': entity.displayOrder,
            'is_active': entity.isActive,
          };
        }).toList();
      },
      config: CacheConfig.staticData, // 24 hours cache
    );

    return result.fold(
      (failure) => Left(failure),
      (dataState) => Right(dataState.data),
    );
  }

  @override
  Future<Either<Failure, List<PartnerEntity>>> getPartners() async {
    final result = await getCachedData<List<PartnerEntity>>(
      cacheKey: 'home_partners',
      fetchFromRemote: () async {
        final models = await remoteDataSource.getPartners();
        return models;
      },
      fromJson: (json) {
        return (json as List)
            .map((item) => PartnerModel.fromJson(item))
            .toList();
      },
      toJson: (data) {
        return data.map((entity) {
          return {
            'company_name': entity.companyName,
            'logo_url': entity.logoUrl,
          };
        }).toList();
      },
      config: CacheConfig.staticData, // 24 hours cache
    );

    return result.fold(
      (failure) => Left(failure),
      (dataState) => Right(dataState.data),
    );
  }
}

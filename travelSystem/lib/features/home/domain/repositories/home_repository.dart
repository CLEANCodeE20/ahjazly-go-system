import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/banner_entity.dart';
import '../entities/partner_entity.dart';

abstract class HomeRepository {
  Future<Either<Failure, List<BannerEntity>>> getBanners();
  Future<Either<Failure, List<PartnerEntity>>> getPartners();
}

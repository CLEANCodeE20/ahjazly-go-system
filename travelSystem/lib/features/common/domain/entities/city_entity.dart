import 'package:equatable/equatable.dart';

/// Entity representing a city
class CityEntity extends Equatable {
  final int cityId;
  final String cityName;
  final String? arabicName;
  final bool isActive;

  const CityEntity({
    required this.cityId,
    required this.cityName,
    this.arabicName,
    required this.isActive,
  });

  @override
  List<Object?> get props => [
        cityId,
        cityName,
        arabicName,
        isActive,
      ];
}

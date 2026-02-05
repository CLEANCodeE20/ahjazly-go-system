import '../../domain/entities/city_entity.dart';

/// Model class for city data
class CityModel extends CityEntity {
  const CityModel({
    required super.cityId,
    required super.cityName,
    super.arabicName,
    required super.isActive,
  });

  /// Create model from JSON
  factory CityModel.fromJson(Map<String, dynamic> json) {
    return CityModel(
      cityId: json['city_id'] as int,
      cityName: json['city_name'] as String,
      arabicName: json['arabic_name'] as String?,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  /// Convert model to JSON
  Map<String, dynamic> toJson() {
    return {
      'city_id': cityId,
      'city_name': cityName,
      if (arabicName != null) 'arabic_name': arabicName,
      'is_active': isActive,
    };
  }

  /// Convert model to entity
  CityEntity toEntity() {
    return CityEntity(
      cityId: cityId,
      cityName: cityName,
      arabicName: arabicName,
      isActive: isActive,
    );
  }
}

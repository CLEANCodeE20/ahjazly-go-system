class City {
  final int cityId;
  final String nameAr;
  final String? nameEn;
  final bool isActive;
  final String countryCode;
  final String? imageUrl;

  City({
    required this.cityId,
    required this.nameAr,
    this.nameEn,
    this.isActive = true,
    this.countryCode = 'YE',
    this.imageUrl,
  });

  factory City.fromJson(Map<String, dynamic> json) {
    return City(
      cityId: json['city_id'] as int,
      nameAr: json['name_ar'] as String,
      nameEn: json['name_en'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      countryCode: json['country_code'] as String? ?? 'YE',
      imageUrl: json['image_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'city_id': cityId,
      'name_ar': nameAr,
      'name_en': nameEn,
      'is_active': isActive,
      'country_code': countryCode,
      'image_url': imageUrl,
    };
  }
}

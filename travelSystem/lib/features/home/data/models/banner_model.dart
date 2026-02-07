

import '../../domain/entities/banner_entity.dart';

class BannerModel extends BannerEntity {
  BannerModel({
    required super.id,
    super.title,
    required super.imageUrl,
    super.targetUrl,
    required super.displayOrder,
    required super.isActive,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'] as int,
      title: json['title'] as String?,
      imageUrl: json['image_url'] as String? ?? '',
      targetUrl: json['target_url'] as String?,
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'image_url': imageUrl,
      'target_url': targetUrl,
      'display_order': displayOrder,
      'is_active': isActive,
    };
  }
}

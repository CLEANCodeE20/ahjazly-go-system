class BannerEntity {
  final int id;
  final String? title;
  final String imageUrl;
  final String? targetUrl;
  final int displayOrder;
  final bool isActive;

  BannerEntity({
    required this.id,
    this.title,
    required this.imageUrl,
    this.targetUrl,
    required this.displayOrder,
    required this.isActive,
  });
}

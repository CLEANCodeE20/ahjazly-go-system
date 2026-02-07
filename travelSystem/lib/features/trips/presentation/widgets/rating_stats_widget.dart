import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../models/rating_model.dart';
import '../controllers/rating_controller.dart';
import '../../domain/entities/rating_entity.dart';
import 'star_rating_widget.dart';

// =============================================
// RATING STATS WIDGET
// مكون إحصائيات التقييمات
// =============================================

class RatingStatsWidget extends StatelessWidget {
  final PartnerRatingStatsEntity stats;

  const RatingStatsWidget({
    Key? key,
    required this.stats,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'إحصائيات التقييمات',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),

            // Overall Rating
            _buildOverallRating(context),

            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 20),

            // Rating Distribution
            const Text(
              'توزيع التقييمات',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildRatingDistribution(),

            if (_hasDetailedRatings()) ...[
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 20),

              // Detailed Ratings
              const Text(
                'التقييمات التفصيلية',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _buildDetailedRatings(),
            ],

            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 20),

            // Summary
            _buildSummary(),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallRating(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            stats.avgOverallRating.toStringAsFixed(1),
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          StarRatingWidget(
            rating: stats.avgOverallRating.round(),
            readOnly: true,
            size: 32,
            activeColor: Colors.white,
            inactiveColor: Colors.white38,
            alignment: MainAxisAlignment.center,
          ),
          const SizedBox(height: 12),
          Text(
            'بناءً على ${stats.totalRatings} تقييم',
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingDistribution() {
    return Column(
      children: [
        RatingBar(
          stars: 5,
          count: stats.fiveStarCount,
          totalCount: stats.totalRatings,
        ),
        const SizedBox(height: 12),
        RatingBar(
          stars: 4,
          count: stats.fourStarCount,
          totalCount: stats.totalRatings,
        ),
        const SizedBox(height: 12),
        RatingBar(
          stars: 3,
          count: stats.threeStarCount,
          totalCount: stats.totalRatings,
        ),
        const SizedBox(height: 12),
        RatingBar(
          stars: 2,
          count: stats.twoStarCount,
          totalCount: stats.totalRatings,
        ),
        const SizedBox(height: 12),
        RatingBar(
          stars: 1,
          count: stats.oneStarCount,
          totalCount: stats.totalRatings,
        ),
      ],
    );
  }

  bool _hasDetailedRatings() {
    return stats.avgServiceRating != null ||
        stats.avgCleanlinessRating != null ||
        stats.avgPunctualityRating != null ||
        stats.avgComfortRating != null ||
        stats.avgValueRating != null;
  }

  Widget _buildDetailedRatings() {
    return Column(
      children: [
        if (stats.avgServiceRating != null)
          _buildDetailedRatingRow(
            'جودة الخدمة',
            stats.avgServiceRating!,
            Icons.support_agent,
            Colors.blue,
          ),
        if (stats.avgCleanlinessRating != null)
          _buildDetailedRatingRow(
            'النظافة',
            stats.avgCleanlinessRating!,
            Icons.cleaning_services,
            Colors.teal,
          ),
        if (stats.avgPunctualityRating != null)
          _buildDetailedRatingRow(
            'الالتزام بالمواعيد',
            stats.avgPunctualityRating!,
            Icons.access_time,
            Colors.orange,
          ),
        if (stats.avgComfortRating != null)
          _buildDetailedRatingRow(
            'الراحة',
            stats.avgComfortRating!,
            Icons.airline_seat_recline_normal,
            Colors.purple,
          ),
        if (stats.avgValueRating != null)
          _buildDetailedRatingRow(
            'القيمة مقابل السعر',
            stats.avgValueRating!,
            Icons.attach_money,
            Colors.green,
          ),
      ],
    );
  }

  Widget _buildDetailedRatingRow(
    String label,
    double rating,
    IconData icon,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    StarRatingWidget(
                      rating: rating.round(),
                      readOnly: true,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      rating.toStringAsFixed(1),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummary() {
    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            'إيجابية',
            '${stats.positivePercentage.toStringAsFixed(0)}%',
            Colors.green,
            Icons.thumb_up,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSummaryCard(
            'سلبية',
            '${stats.negativePercentage.toStringAsFixed(0)}%',
            Colors.red,
            Icons.thumb_down,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================
// COMPACT RATING STATS WIDGET
// مكون إحصائيات مصغر
// =============================================

class CompactRatingStats extends StatelessWidget {
  final int partnerId;

  const CompactRatingStats({
    Key? key,
    required this.partnerId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<RatingController>();

    return FutureBuilder(
      future: controller.loadPartnerStats(partnerId),
      builder: (context, snapshot) {
        return Obx(() {
          final stats = controller.partnerStats.value;

          if (stats == null) {
            return const SizedBox.shrink();
          }

          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.star,
                  color: Color(0xFFFFA000),
                  size: 20,
                ),
                const SizedBox(width: 6),
                Text(
                  stats.avgOverallRating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '(${stats.totalRatings})',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          );
        });
      },
    );
  }
}

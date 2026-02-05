import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart' as intl;
import '../controllers/rating_controller.dart';
import '../models/rating_model.dart';
import '../widgets/star_rating_widget.dart';

// =============================================
// RATING CARD WIDGET
// بطاقة عرض تقييم واحد
// =============================================

class RatingCardWidget extends StatelessWidget {
  final TripRating rating;
  final VoidCallback? onReport;

  const RatingCardWidget({
    Key? key,
    required this.rating,
    this.onReport,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.find<RatingController>();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    rating.userName[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rating.userName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _formatDate(rating.ratingDate),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                _buildRatingBadge(rating.stars),
              ],
            ),

            const SizedBox(height: 16),

            // Overall Rating
            StarRatingWidget(
              rating: rating.stars,
              readOnly: true,
              size: 24,
            ),

            // Detailed Ratings
            if (_hasDetailedRatings()) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              Wrap(
                spacing: 16,
                runSpacing: 12,
                children: [
                  if (rating.serviceRating != null)
                    _buildDetailChip(
                      'الخدمة',
                      rating.serviceRating!,
                      Icons.support_agent,
                      Colors.blue,
                    ),
                  if (rating.cleanlinessRating != null)
                    _buildDetailChip(
                      'النظافة',
                      rating.cleanlinessRating!,
                      Icons.cleaning_services,
                      Colors.teal,
                    ),
                  if (rating.punctualityRating != null)
                    _buildDetailChip(
                      'المواعيد',
                      rating.punctualityRating!,
                      Icons.access_time,
                      Colors.orange,
                    ),
                  if (rating.comfortRating != null)
                    _buildDetailChip(
                      'الراحة',
                      rating.comfortRating!,
                      Icons.airline_seat_recline_normal,
                      Colors.purple,
                    ),
                  if (rating.valueForMoneyRating != null)
                    _buildDetailChip(
                      'القيمة',
                      rating.valueForMoneyRating!,
                      Icons.attach_money,
                      Colors.green,
                    ),
                ],
              ),
            ],

            // Comment
            if (rating.comment != null && rating.comment!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  rating.comment!,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ),
            ],

            // Partner Response
            if (rating.hasResponse && rating.responseText != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border(
                    right: BorderSide(
                      color: Colors.blue[700]!,
                      width: 3,
                    ),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.reply,
                          size: 16,
                          color: Colors.blue[700],
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'رد الشريك',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[700],
                          ),
                        ),
                        if (rating.responseDate != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            _formatDate(rating.responseDate!),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      rating.responseText!,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.blue[900],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Actions
            const SizedBox(height: 16),
            Row(
              children: [
                _buildActionButton(
                  icon: Icons.thumb_up_outlined,
                  label: 'مفيد (${rating.helpfulCount})',
                  onTap: () => controller.markHelpful(
                    ratingId: rating.ratingId,
                    isHelpful: true,
                  ),
                ),
                const SizedBox(width: 12),
                _buildActionButton(
                  icon: Icons.thumb_down_outlined,
                  label: 'غير مفيد (${rating.notHelpfulCount})',
                  onTap: () => controller.markHelpful(
                    ratingId: rating.ratingId,
                    isHelpful: false,
                  ),
                ),
                const Spacer(),
                if (onReport != null)
                  IconButton(
                    icon: const Icon(Icons.flag_outlined),
                    color: Colors.red[400],
                    onPressed: onReport,
                    tooltip: 'إبلاغ',
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  bool _hasDetailedRatings() {
    return rating.serviceRating != null ||
        rating.cleanlinessRating != null ||
        rating.punctualityRating != null ||
        rating.comfortRating != null ||
        rating.valueForMoneyRating != null;
  }

  Widget _buildRatingBadge(int stars) {
    Color color;
    String label;

    if (stars >= 4) {
      color = Colors.green;
      label = 'ممتاز';
    } else if (stars == 3) {
      color = Colors.orange;
      label = 'جيد';
    } else {
      color = Colors.red;
      label = 'يحتاج تحسين';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildDetailChip(
    String label,
    int rating,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          const SizedBox(width: 6),
          Row(
            children: List.generate(
              5,
              (index) => Icon(
                index < rating ? Icons.star : Icons.star_border,
                size: 12,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.grey[600]),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'اليوم';
    } else if (difference.inDays == 1) {
      return 'أمس';
    } else if (difference.inDays < 7) {
      return 'منذ ${difference.inDays} أيام';
    } else if (difference.inDays < 30) {
      return 'منذ ${(difference.inDays / 7).floor()} أسابيع';
    } else {
      return intl.DateFormat('dd/MM/yyyy').format(date);
    }
  }
}

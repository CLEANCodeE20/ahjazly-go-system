import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/rating_controller.dart';
import '../widgets/rating_card_widget.dart';

// =============================================
// TRIP RATINGS PAGE
// صفحة عرض تقييمات الرحلة
// =============================================

class TripRatingsPage extends StatefulWidget {
  final int tripId;
  final String routeName;

  const TripRatingsPage({
    Key? key,
    required this.tripId,
    required this.routeName,
  }) : super(key: key);

  @override
  State<TripRatingsPage> createState() => _TripRatingsPageState();
}

class _TripRatingsPageState extends State<TripRatingsPage> {
  final RatingController _controller = Get.put(RatingController());
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadRatings();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _loadRatings() {
    _controller.loadTripRatings(widget.tripId, refresh: true);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.9) {
      if (!_controller.isLoading.value && _controller.hasMoreRatings.value) {
        _controller.loadTripRatings(widget.tripId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'تقييمات الرحلة',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: Column(
              children: [
                Text(
                  widget.routeName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Obx(() {
                  final count = _controller.tripRatings.length;
                  return Text(
                    '$count تقييم',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  );
                }),
              ],
            ),
          ),

          // Ratings List
          Expanded(
            child: Obx(() {
              if (_controller.isLoading.value &&
                  _controller.tripRatings.isEmpty) {
                return const Center(
                  child: CircularProgressIndicator(),
                );
              }

              if (_controller.tripRatings.isEmpty) {
                return _buildEmptyState();
              }

              return RefreshIndicator(
                onRefresh: () async => _loadRatings(),
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: _controller.tripRatings.length +
                      (_controller.hasMoreRatings.value ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _controller.tripRatings.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }

                    final rating = _controller.tripRatings[index];
                    return RatingCardWidget(
                      rating: rating,
                      onReport: () => _showReportDialog(rating.ratingId),
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.star_border,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          Text(
            'لا توجد تقييمات بعد',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'كن أول من يقيم هذه الرحلة',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  void _showReportDialog(int ratingId) {
    String? selectedReason;
    final TextEditingController descriptionController =
        TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إبلاغ عن تقييم'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('يرجى اختيار سبب البلاغ:'),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'السبب',
              ),
              items: const [
                DropdownMenuItem(
                  value: 'inappropriate',
                  child: Text('محتوى غير مناسب'),
                ),
                DropdownMenuItem(
                  value: 'spam',
                  child: Text('رسالة مزعجة'),
                ),
                DropdownMenuItem(
                  value: 'offensive',
                  child: Text('محتوى مسيء'),
                ),
                DropdownMenuItem(
                  value: 'fake',
                  child: Text('تقييم وهمي'),
                ),
                DropdownMenuItem(
                  value: 'misleading',
                  child: Text('معلومات مضللة'),
                ),
                DropdownMenuItem(
                  value: 'other',
                  child: Text('أخرى'),
                ),
              ],
              onChanged: (value) => selectedReason = value,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: 'تفاصيل إضافية (اختياري)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              if (selectedReason != null) {
                _controller.reportRating(
                  ratingId: ratingId,
                  reason: selectedReason!,
                  description: descriptionController.text.isNotEmpty
                      ? descriptionController.text
                      : null,
                );
                Navigator.pop(context);
              }
            },
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
  }
}

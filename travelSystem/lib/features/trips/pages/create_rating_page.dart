import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/rating_controller.dart';
import '../widgets/star_rating_widget.dart';
import '../widgets/confetti_widget.dart'; // Import the custom confetti

// =============================================
// CREATE RATING PAGE
// صفحة إنشاء تقييم جديد (Premium Design)
// =============================================

class CreateRatingPage extends StatefulWidget {
  const CreateRatingPage({Key? key}) : super(key: key);

  @override
  State<CreateRatingPage> createState() => _CreateRatingPageState();
}

class _CreateRatingPageState extends State<CreateRatingPage>
    with SingleTickerProviderStateMixin {
  final RatingController _controller = Get.find<RatingController>();
  late TabController _tabController;
  final TextEditingController _commentController = TextEditingController();

  late int tripId;
  late int bookingId;
  late int partnerId;
  int? driverId;
  late String routeName;
  bool _showConfetti = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _controller.resetForm();

    // Get arguments
    final args = Get.arguments as Map<String, dynamic>;
    tripId = args['tripId'];
    bookingId = args['bookingId'];
    partnerId = args['partnerId'];
    driverId = args['driverId'];
    routeName = args['routeName'] ?? 'الرحلة';
  }

  @override
  void dispose() {
    _tabController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitRating() async {
      // Trigger confetti immediately for UX feedback if validation passes (simple check here)
      if (_controller.overallStars.value > 0) {
          setState(() {
              _showConfetti = true;
          });
          
          await Future.delayed(const Duration(milliseconds: 500)); // Wait for animation
          
          final success = await _controller.createRating(
              tripId: tripId,
              bookingId: bookingId,
              partnerId: partnerId,
              driverId: driverId,
          );

          if (success) {
               // Show success dialog
               await Get.dialog(
                 Dialog(
                   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                   child: ConfettiWidget(
                      isPlaying: true, // Re-play confetti in dialog
                      child: Padding(
                       padding: const EdgeInsets.all(30),
                       child: Column(
                         mainAxisSize: MainAxisSize.min,
                         children: [
                           const Icon(Icons.check_circle, color: Colors.green, size: 80),
                           const SizedBox(height: 20),
                           const Text(
                             'شكراً لك!',
                             style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                           ),
                           const SizedBox(height: 10),
                           const Text(
                             'تم استلام تقييمك بنجاح.',
                             textAlign: TextAlign.center,
                             style: TextStyle(fontSize: 16, color: Colors.grey),
                           ),
                           const SizedBox(height: 30),
                           SizedBox(
                             width: double.infinity,
                             child: ElevatedButton(
                               onPressed: () => Get.back(),
                               style: ElevatedButton.styleFrom(
                                 backgroundColor: Colors.green,
                                 shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                                 padding: const EdgeInsets.symmetric(vertical: 15),
                               ),
                               child: const Text('حسناً', style: TextStyle(color: Colors.white, fontSize: 16)),
                             ),
                           ),
                         ],
                       ),
                     ),
                   ),
                 ),
                 barrierDismissible: false,
               );
               Get.back(result: true); // Return to previous screen with success result
          } else {
               setState(() { _showConfetti = false; }); // Stop confetti on error
          }
      } else {
        Get.snackbar('تنبيه', 'يرجى اختيار التقييم العام', snackPosition: SnackPosition.BOTTOM);
      }
  }

  @override
  Widget build(BuildContext context) {
    return ConfettiWidget( // Wrap entire page for full-screen confetti possibility
      isPlaying: _showConfetti,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F7FA), // Premium Light Background
        body: CustomScrollView(
          slivers: [
            // Premium Sliver App Bar
            SliverAppBar(
              expandedHeight: 180,
              pinned: true,
              backgroundColor: Theme.of(context).colorScheme.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Theme.of(context).colorScheme.primary,
                        Theme.of(context).colorScheme.primary.withOpacity(0.8),
                      ],
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 30),
                        Container(
                           padding: const EdgeInsets.all(15),
                           decoration: BoxDecoration(
                               color: Colors.white.withOpacity(0.2),
                               shape: BoxShape.circle,
                               border: Border.all(color: Colors.white.withOpacity(0.3), width: 2)
                           ),
                           child: const Icon(Icons.star_rounded, size: 50, color: Colors.white),
                        ),
                        const SizedBox(height: 15),
                        Text(
                          routeName,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontFamily: 'Cairo', // Assuming Cairo font
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                onPressed: () => Get.back(),
              ),
              shape: const ContinuousRectangleBorder(
                 borderRadius: BorderRadius.only(
                     bottomLeft: Radius.circular(50),
                     bottomRight: Radius.circular(50)
                 )
              ),
            ),
    
            // Content
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Tabs
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5)),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(6.0),
                        child: TabBar(
                          controller: _tabController,
                          indicator: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            color: Theme.of(context).colorScheme.primary,
                            boxShadow: [
                               BoxShadow(color: Theme.of(context).colorScheme.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4)),
                            ]
                          ),
                          labelColor: Colors.white,
                          unselectedLabelColor: Colors.grey[600],
                          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                          tabs: const [
                            Tab(text: 'التقييم العام'),
                            Tab(text: 'التفاصيل'),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 25),
    
                    // Tab Content (Manually managed height to fit in Sliver)
                    AnimatedBuilder(
                       animation: _tabController,
                       builder: (context, _) {
                            return _tabController.index == 0
                                ? _buildOverallRatingTab()
                                : _buildDetailedRatingTab();
                       }
                    ),
                    
                    const SizedBox(height: 30),
    
                    // Submit Button
                    Obx(
                      () => Container(
                        width: double.infinity,
                        height: 55,
                        decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                                colors: _controller.overallStars.value > 0
                                    ? [Theme.of(context).colorScheme.primary, Theme.of(context).colorScheme.primary.withOpacity(0.8)]
                                    : [Colors.grey, Colors.grey.shade400],
                            ),
                            boxShadow: _controller.overallStars.value > 0 ? [
                                BoxShadow(
                                    color: Theme.of(context).colorScheme.primary.withOpacity(0.4),
                                    blurRadius: 12,
                                    offset: const Offset(0, 6)
                                )
                            ] : [],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: _controller.isSubmitting.value ? null : _submitRating,
                            child: Center(
                              child: _controller.isSubmitting.value
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text(
                                      'إرسال التقييم',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Cairo'
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallRatingTab() {
    return Column(
      children: [
        // Overall Rating Card
        Container(
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(
                'كيف كانت رحلتك؟',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800],
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 20),
              Obx(
                () => AnimatedStarRating(
                  rating: _controller.overallStars.value,
                  onRatingChanged: _controller.setOverallStars,
                  size: 45,
                ),
              ),
              const SizedBox(height: 20),
              
              // Animated Emoji/Text Response
              Obx(() {
                final stars = _controller.overallStars.value;
                String message = 'اضغط لتقييم الرحلة';
                String emoji = '👋';
                Color color = Colors.grey;
                
                if (stars > 0) {
                    if (stars == 5) {
                      message = 'تجربة ممتازة!';
                      emoji = '🥰';
                      color = Colors.green;
                    } else if (stars == 4) {
                      message = 'تجربة جيدة جداً';
                      emoji = '😊';
                      color = Colors.lightGreen;
                    } else if (stars == 3) {
                      message = 'تجربة متوسطة';
                      emoji = '😐';
                      color = Colors.orange;
                    } else if (stars == 2) {
                      message = 'تحتاج تحسين';
                      emoji = '😕';
                      color = Colors.deepOrange;
                    } else if (stars == 1) {
                      message = 'تجربة سيئة';
                      emoji = '😠';
                      color = Colors.red;
                    }
                }

                return AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: Column(
                        key: ValueKey(stars),
                        children: [
                             Text(emoji, style: const TextStyle(fontSize: 40)),
                             const SizedBox(height: 5),
                             Text(
                               message,
                               style: TextStyle(
                                 fontSize: 16,
                                 fontWeight: FontWeight.bold,
                                 color: color,
                                 fontFamily: 'Cairo'
                               ),
                             )
                        ],
                    ),
                );
              }),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Comment Input
        Container(
          decoration: BoxDecoration(
             color: Colors.white,
             borderRadius: BorderRadius.circular(24),
             boxShadow: [
                 BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5))
             ]
          ),
          child: TextField(
            controller: _commentController,
            maxLines: 4,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: 'اكتب ملاحظاتك هنا (اختياري)...',
              hintStyle: TextStyle(color: Colors.grey[400], fontFamily: 'Cairo', fontSize: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.all(20),
            ),
            onChanged: _controller.setComment,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailedRatingTab() {
    return Column(
      children: [
         Container(
             padding: const EdgeInsets.all(20),
             decoration: BoxDecoration(
                 color: Colors.white,
                 borderRadius: BorderRadius.circular(24),
                 boxShadow: [
                     BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 10))
                 ]
             ),
             child: Column(
                 crossAxisAlignment: CrossAxisAlignment.start,
                 children: [
                    const Padding(
                      padding: EdgeInsets.only(bottom: 15),
                      child: Text('تفاصيل التجربة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                    ),
                    _buildDetailedRatingItem(icon: Icons.support_agent, title: 'الخدمة', rating: _controller.serviceStars, onChanged: _controller.setServiceStars, color: Colors.blue),
                    const Divider(height: 30),
                    _buildDetailedRatingItem(icon: Icons.cleaning_services_rounded, title: 'النظافة', rating: _controller.cleanlinessStars, onChanged: _controller.setCleanlinessStars, color: Colors.teal),
                    const Divider(height: 30),
                    _buildDetailedRatingItem(icon: Icons.timer_rounded, title: 'الموعد', rating: _controller.punctualityStars, onChanged: _controller.setPunctualityStars, color: Colors.orange),
                    const Divider(height: 30),
                    _buildDetailedRatingItem(icon: Icons.chair_alt_rounded, title: 'الراحة', rating: _controller.comfortStars, onChanged: _controller.setComfortStars, color: Colors.purple),
                    const Divider(height: 30),
                    _buildDetailedRatingItem(icon: Icons.attach_money_rounded, title: 'القيمة', rating: _controller.valueStars, onChanged: _controller.setValueStars, color: Colors.green),
                 ],
             ),
         )
      ],
    );
  }

  Widget _buildDetailedRatingItem({
    required IconData icon,
    required String title,
    required RxInt rating,
    required Function(int) onChanged,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(width: 15),
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
        const Spacer(),
        Obx(
          () => StarRatingWidget(
            rating: rating.value,
            onRatingChanged: onChanged,
            size: 24,
          ),
        ),
      ],
    );
  }
}

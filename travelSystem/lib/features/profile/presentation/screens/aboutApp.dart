import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/constants/images.dart';

class AboutApp extends StatelessWidget {
  const AboutApp({super.key});

  Future<void> _launchURL(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // --- Premium Header ---
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppColor.color_primary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColor.color_primary, AppColor.color_primary.withOpacity(0.8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      Container(
                        padding: const EdgeInsets.all(15),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Image.asset(AppImage.image_logo, width: 80, height: 80),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // --- App Identity ---
                  const Text(
                    "نظام السفر المتكامل",
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColor.color_primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "الإصدار 1.0.0",
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColor.color_primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // --- Features Section ---
                  _buildAboutSection(
                    title: "من نحن",
                    content: "نحن في نظام السفر نسعى لتوفير تجربة حجز رحلات سلسة وآمنة للمسافرين في جميع أنحاء اليمن، مع التركيز على الجودة والراحة وأفضل الأسعار.",
                    icon: Icons.info_outline_rounded,
                  ),
                  const SizedBox(height: 20),

                  _buildFeaturesGrid(),
                  const SizedBox(height: 30),

                  // --- Social Media Section ---
                  _buildSocialSection(),
                  
                  const SizedBox(height: 40),
                  Text(
                    "تم التطوير بكل حب © 2024",
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 12,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAboutSection({required String title, required String content, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColor.color_primary, size: 20),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14,
              height: 1.6,
              color: Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturesGrid() {
    final features = [
      {'icon': Icons.speed_rounded, 'label': 'سرعة في الحجز'},
      {'icon': Icons.shield_rounded, 'label': 'أمان تام'},
      {'icon': Icons.support_agent_rounded, 'label': 'دعم 24/7'},
      {'icon': Icons.local_offer_rounded, 'label': 'أفضل الأسعار'},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 15,
        crossAxisSpacing: 15,
        childAspectRatio: 2.2,
      ),
      itemCount: features.length,
      itemBuilder: (context, index) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: Row(
            children: [
              Icon(features[index]['icon'] as IconData, color: AppColor.color_primary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  features[index]['label'] as String,
                  style: const TextStyle(fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSocialSection() {
    return Column(
      children: [
        const Text(
          "تابعنا على منصاتنا",
          style: TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 20),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialIcon(Icons.facebook, const Color(0xFF1877F2), 'https://facebook.com'),
            const SizedBox(width: 20),
            _buildSocialIcon(Icons.camera_alt_rounded, const Color(0xFFE4405F), 'https://instagram.com'),
            const SizedBox(width: 20),
            _buildSocialIcon(Icons.phone_rounded, const Color(0xFF25D366), 'https://wa.me/96712159295'),
          ],
        ),
      ],
    );
  }

  Widget _buildSocialIcon(IconData icon, Color color, String url) {
    return InkWell(
      onTap: () => _launchURL(url),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 28),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../../shared/widgets/app_network_image.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';

class PopularDestinationsWidget extends StatelessWidget {
  final List<Map<String, String>> destinations;
  final Function(String city) onSelect;

  const PopularDestinationsWidget({
    super.key,
    required this.destinations,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            'وجهات شائعة',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
              color: Theme.of(context).brightness == Brightness.dark ? Colors.white : AppColor.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 15,
            mainAxisSpacing: 15,
            childAspectRatio: 1.4,
          ),
          itemCount: destinations.length,
          itemBuilder: (context, index) {
            final dest = destinations[index];
            return InkWell(
              onTap: () => onSelect(dest['name']!),
              borderRadius: BorderRadius.circular(15),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: Stack(
                    children: [
                      // Image with Shimmer and Error Handling
                      AppNetworkImage(
                        imageUrl: dest['image']!,
                        width: double.infinity,
                        height: double.infinity,
                        borderRadius: 15,
                      ),
                      
                      // Dark Overlay for text readability
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.7),
                            ],
                          ),
                        ),
                      ),
                      
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              dest['name']!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            Text(
                              '${dest['trips']} رحلة يومياً',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 10,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

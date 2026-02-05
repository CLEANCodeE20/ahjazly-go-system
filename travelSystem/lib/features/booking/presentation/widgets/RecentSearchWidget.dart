import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';

class RecentSearchWidget extends StatelessWidget {
  final List<Map<String, String>> searches;
  final Function(String from, String to) onSelect;

  const RecentSearchWidget({
    super.key,
    required this.searches,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (searches.isEmpty) return const SizedBox.shrink();

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              'عمليات البحث الأخيرة',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
                color: Theme.of(context).brightness == Brightness.dark ? Colors.white : AppColor.textPrimary,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 50,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: searches.length,
              separatorBuilder: (context, index) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final search = searches[index];
                return InkWell(
                  onTap: () => onSelect(search['from']!, search['to']!),
                  borderRadius: BorderRadius.circular(25),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.white.withOpacity(0.1) 
                          : AppColor.primary.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color: Theme.of(context).brightness == Brightness.dark 
                            ? Colors.white.withOpacity(0.2) 
                            : AppColor.primary.withOpacity(0.1),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.history, size: 16, color: AppColor.primary),
                        const SizedBox(width: 8),
                        Text(
                          '${search['from']} ➔ ${search['to']}',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w500,
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );
    });
  }
}

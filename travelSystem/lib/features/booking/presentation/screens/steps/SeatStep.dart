import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../../core/classes/StatusRequest.dart';
import '../../../../../shared/widgets/no_internet_widget.dart';
import '../../../controller/WizardController.dart';
import '../../../controller/seat_view_Controller.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../../core/constants/Color.dart';
import '../../../data/static/seat_info.dart';

class SeatStep extends StatelessWidget {
  const SeatStep({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final vm = Get.put(SeatViewModel());
    final wizard = Get.find<WizardController>();

    // Colors from Theme schema
    final Color standardColor = theme.colorScheme.primary.withOpacity(0.5); // Light Purple
    final Color premiumColor = theme.colorScheme.secondary;  // Yellow
    final Color takenColor = theme.colorScheme.outline.withOpacity(0.3);    // Grey
    final Color selectedColor = theme.colorScheme.primary; // Purple
    final Color tableColor = theme.dividerColor.withOpacity(0.1);

    return Obx(() {
      if (vm.isOffline) {
        return NoInternetWidget(onRetry: vm.retry);
      }
      if (vm.isLoading) {
        return _buildShimmerLoading(context);
      }
      if (vm.isError) {
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off, size: 50, color: theme.colorScheme.outline),
              const SizedBox(height: 16),
              Text(vm.errorMessage.value, style: theme.textTheme.bodyMedium),
              TextButton(onPressed: vm.retry, child: Text("إعادة المحاولة", style: TextStyle(color: theme.colorScheme.primary)))
            ],
          ),
        );
      }

      final seatGrid = vm.seatGrid;
      final totalPassengers = wizard.passengers.length;
      final selectedCount = vm.selectedSeats.length;
      final remaining = totalPassengers - selectedCount;

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
           Row(
            children: [
              Icon(Icons.event_seat, size: 28, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Text(
                "اختيار المقاعد",
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Container(
                 padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                 decoration: BoxDecoration(
                   color: remaining == 0 ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                   borderRadius: BorderRadius.circular(12)
                 ),
                 child: Text(
                   remaining == 0 ? "مكتمل" : "متبقي $remaining",
                   style: TextStyle(
                     color: remaining == 0 ? Colors.green : Colors.orange,
                     fontWeight: FontWeight.bold
                   ),
                 ),
              )
            ],
          ),
          const SizedBox(height: 16),
          
          // Legend
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.brightness == Brightness.dark ? const Color(0xFF1E293B) : theme.cardTheme.color,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(theme.brightness == Brightness.dark ? 0.2 : 0.03), blurRadius: 5)
              ],
              border: Border.all(color: theme.brightness == Brightness.dark ? Colors.white10 : theme.dividerColor.withOpacity(0.1)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _legendItem(theme, standardColor, "عادي"),
                _legendItem(theme, premiumColor, "مميز"),
                _legendItem(theme, takenColor, "محجوز", isTaken: true),
                _legendItem(theme, selectedColor, "مختار"),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: theme.brightness == Brightness.dark ? const Color(0xFF1E293B) : theme.cardTheme.color,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(theme.brightness == Brightness.dark ? 0.3 : 0.05), blurRadius: 20, offset: const Offset(0, 5))
                ],
                border: Border.all(color: theme.brightness == Brightness.dark ? Colors.white10 : theme.dividerColor.withOpacity(0.1))
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      // Driver area visual
                      Container(
                        width: 200,
                        height: 5,
                        margin: const EdgeInsets.only(bottom: 30),
                        decoration: BoxDecoration(
                          color: theme.dividerColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(5)
                        ),
                      ),
                      
                      ...List.generate(seatGrid.length, (rowIdx) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: seatGrid[rowIdx].map((seat) {
                              return _seatWidget(
                                theme: theme,
                                seat: seat,
                                isSelected: seat.layoutNumber != null && vm.selectedSeats.contains(seat.layoutNumber),
                                onToggle: vm.toggleSeat,
                                standardColor: standardColor,
                                premiumColor: premiumColor,
                                takenColor: takenColor,
                                selectedColor: selectedColor,
                                tableColor: tableColor,
                              );
                            }).toList(),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: OutlinedButton(
                    onPressed: wizard.previousStep,
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                    ),
                    child: const Text("رجوع"),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: selectedCount == totalPassengers
                        ? () async {
                            final ok = await vm.confirmSeats();
                            if (ok) wizard.nextStep();
                          }
                        : null,
                     style: ElevatedButton.styleFrom(
                      backgroundColor: selectedColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 2
                    ),
                    child: Text(
                      selectedCount == totalPassengers ? "تأكيد المقاعد" : "اختر المقاعد ($selectedCount/$totalPassengers)",
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    });
  }

  Widget _legendItem(ThemeData theme, Color color, String label, {bool isTaken = false}) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: isTaken ? null : Border.all(color: theme.dividerColor.withOpacity(0.2))
          ),
          child: isTaken ? const Icon(Icons.close, size: 10, color: Colors.white) : null,
        ),
        const SizedBox(width: 6),
        Text(label, style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold, fontSize: 12)),
      ],
    );
  }

  Widget _seatWidget({
    required ThemeData theme,
    required SeatInfo seat,
    required bool isSelected,
    required Function(int) onToggle,
    required Color standardColor,
    required Color premiumColor,
    required Color takenColor,
    required Color selectedColor,
    required Color tableColor,
  }) {
    final bool isTaken = seat.type == SeatType.taken;
    final bool isTable = seat.type == SeatType.table || seat.layoutNumber == null;

    if (isTable) {
      return Container(
        width: 44, height: 44,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: tableColor.withOpacity(0.5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(child: Icon(Icons.table_bar, size: 16, color: Colors.grey)),
      );
    }

    Color bgColor = theme.brightness == Brightness.dark ? const Color(0xFF1E293B) : (theme.cardTheme.color ?? Colors.white);
    Color borderColor = theme.brightness == Brightness.dark ? Colors.white10 : theme.dividerColor.withOpacity(0.3);
    Color textColor = theme.brightness == Brightness.dark ? Colors.white : (theme.textTheme.bodyLarge?.color ?? Colors.black87);

    if (isTaken) {
      bgColor = takenColor;
      borderColor = takenColor;
      textColor = Colors.white;
    } else if (isSelected) {
      bgColor = selectedColor;
      borderColor = selectedColor;
      textColor = Colors.white;
    } else if (seat.type == SeatType.premium) {
      borderColor = premiumColor;
      textColor = premiumColor;
    } else {
      borderColor = standardColor;
      textColor = standardColor;
    }

    return GestureDetector(
      onTap: isTaken ? null : () => onToggle(seat.layoutNumber!),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44, 
        height: 44,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor, width: 1.5),
          boxShadow: isSelected ? [
            BoxShadow(color: selectedColor.withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 2))
          ] : null
        ),
        alignment: Alignment.center,
        child: isTaken 
           ? const Icon(Icons.close, color: Colors.white, size: 20)
           : Text(
               seat.code ?? "${seat.layoutNumber}",
               style: TextStyle(
                 color: textColor,
                 fontWeight: FontWeight.bold,
                 fontSize: 14
               ),
             ),
      ).animate(target: isSelected ? 1 : 0).scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 200.ms, curve: Curves.easeOutBack),
    );
  }
  Widget _buildShimmerLoading(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final baseColor = isDark ? Colors.grey[900]! : Colors.grey[300]!;
    final highlightColor = isDark ? Colors.grey[800]! : Colors.grey[100]!;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Shimmer.fromColors(
        baseColor: baseColor,
        highlightColor: highlightColor,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
             // Header Shimmer
             Row(
              children: [
                Container(width: 30, height: 30, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Container(width: 150, height: 20, color: Colors.white),
                 const Spacer(),
                 Container(width: 80, height: 30, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
              ],
            ),
            const SizedBox(height: 16),
             // Legend Shimmer
            Container(width: double.infinity, height: 60, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12))),
            const SizedBox(height: 16),
            // Grid Shimmer
            Expanded(
              child: Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
                 padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Container(width: 200, height: 5, color: Colors.white),
                    const SizedBox(height: 30),
                    Expanded(
                      child: GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1,
                        ),
                        itemCount: 20,
                        itemBuilder: (_, __) => Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.white)
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

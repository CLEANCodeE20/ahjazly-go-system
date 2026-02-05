import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../../core/constants/Color.dart';
import '../../../../../core/constants/app_constants.dart';
import '../../../../../core/constants/dimensions.dart';
import '../../../controller/WizardController.dart';
import '../../../controller/passenger_count_controller.dart';


/// خطوة اختيار عدد الركاب - بدون setState
class PassengerCountStep extends StatelessWidget {
  PassengerCountStep({Key? key}) : super(key: key);
  
  // استخدام Controllers
  final controller = Get.put(PassengerCountController());
  final wizardController = Get.find<WizardController>();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(AppDimensions.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                const SizedBox(height: AppDimensions.spacingLarge),
                _buildPassengerTypeCard(context),
                const SizedBox(height: AppDimensions.spacingMedium),
                _buildSummary(context),
              ],
            ),
          ),
        ),
        _buildNextButton(context),
      ],
    );
  }
  
  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'عدد الركاب',
          style: theme.textTheme.displaySmall?.copyWith(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'اختر عدد الركاب للرحلة',
          style: theme.textTheme.bodyMedium,
        ),
      ],
    );
  }
  
  Widget _buildPassengerTypeCard(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.cardTheme.color,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.dividerColor.withOpacity(0.1)),
      ),
      child: Padding(
        padding: EdgeInsets.all(AppDimensions.paddingMedium),
        child: Column(
          children: [
            _buildPassengerCounter(
              context: context,
              label: 'البالغين',
              subtitle: '12 سنة فأكثر',
              icon: Icons.person,
              count: controller.adults,
              onIncrement: controller.incrementAdults,
              onDecrement: controller.decrementAdults,
            ),
            const Divider(height: 32),
            _buildPassengerCounter(
              context: context,
              label: 'الأطفال',
              subtitle: 'أقل من 12 سنة',
              icon: Icons.child_care,
              count: controller.children,
              onIncrement: controller.incrementChildren,
              onDecrement: controller.decrementChildren,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPassengerCounter({
    required BuildContext context,
    required String label,
    required String subtitle,
    required IconData icon,
    required RxInt count,
    required VoidCallback onIncrement,
    required VoidCallback onDecrement,
  }) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: theme.colorScheme.primary,
            size: 28,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.primary,
                ),
              ),
              Text(
                subtitle,
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
        _buildCounterControls(context, count, onIncrement, onDecrement),
      ],
    );
  }
  
  Widget _buildCounterControls(
    BuildContext context,
    RxInt count,
    VoidCallback onIncrement,
    VoidCallback onDecrement,
  ) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.brightness == Brightness.dark ? Colors.white.withOpacity(0.05) : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildCounterButton(
            context: context,
            icon: Icons.remove,
            onPressed: onDecrement,
            enabled: count,
          ),
          Obx(() => Container(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              '${count.value}',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
          )),
          _buildCounterButton(
            context: context,
            icon: Icons.add,
            onPressed: onIncrement,
            enabled: count,
          ),
        ],
      ),
    );
  }
  
  Widget _buildCounterButton({
    required BuildContext context,
    required IconData icon,
    required VoidCallback onPressed,
    required RxInt enabled,
  }) {
    final theme = Theme.of(context);
    return Obx(() {
      final canPress = controller.totalPassengers < AppConstants.maxPassengers ||
                       icon == Icons.remove;
      
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: canPress ? onPressed : null,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: EdgeInsets.all(8),
            child: Icon(
              icon,
              color: canPress ? theme.colorScheme.primary : theme.colorScheme.outline.withOpacity(0.5),
              size: 20,
            ),
          ),
        ),
      );
    });
  }
  
  Widget _buildSummary(BuildContext context) {
    final theme = Theme.of(context);
    return Obx(() {
      if (controller.totalPassengers == 0) return SizedBox.shrink();
      
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.primary.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.people,
              color: theme.colorScheme.primary,
              size: 24,
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'إجمالي الركاب',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  Text(
                    '${controller.totalPassengers} راكب',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            if (controller.validationMessage != null)
              Icon(
                Icons.warning,
                color: Colors.orange,
                size: 24,
              ),
          ],
        ),
      );
    });
  }
  
  Widget _buildNextButton(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: EdgeInsets.all(AppDimensions.paddingMedium),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(theme.brightness == Brightness.dark ? 0.2 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Obx(() {
          final canProceed = controller.totalPassengers > 0;
          final validationMsg = controller.validationMessage;
          
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Validation Message
              if (validationMsg != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Colors.orange.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.orange, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          validationMsg,
                          style: const TextStyle(
                            color: Colors.orange,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              
              // Next Button
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: canProceed ? _handleNext : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: canProceed 
                        ? AppColor.primary 
                        : (theme.brightness == Brightness.dark ? Colors.white.withOpacity(0.05) : Colors.grey.shade300),
                    foregroundColor: canProceed ? Colors.white : Colors.grey.shade500,
                    elevation: canProceed ? 4 : 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'التالي',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_rounded, size: 24),
                    ],
                  ),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
  
  void _handleNext() {
    // Update wizard controller with passenger counts
    wizardController.setPassengerCounts(
      controller.adults.value,
      controller.children.value,
    );
    
    // Move to next step with animation
    wizardController.nextStep();
  }
}

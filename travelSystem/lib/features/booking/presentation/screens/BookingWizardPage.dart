import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:travelsystem/features/booking/presentation/screens/steps/ConfirmStep.dart';
import 'package:travelsystem/features/booking/presentation/screens/steps/SeatStep.dart';
import 'package:travelsystem/features/booking/presentation/screens/steps/booking_summary_step.dart';
import 'package:travelsystem/features/booking/presentation/screens/steps/passenger_count_step.dart';
import 'package:travelsystem/features/booking/presentation/screens/steps/passenger_details_step.dart';
import 'package:travelsystem/features/booking/presentation/widgets/WizardStepper.dart';


import '../../controller/WizardController.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../trips/domain/entities/trip_entity.dart';

class BookingWizardPage extends StatelessWidget {
  const BookingWizardPage({super.key});

  final List<String> steps = const [
    "عدد الركاب",
    "بيانات الركاب",
    "اختيار المقاعد",
    "ملخص الحجز",
    "الدفع",
  ];

  @override
  Widget build(BuildContext context) {
    final TripEntity trip = Get.arguments as TripEntity;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GetBuilder<WizardController>(
      init: WizardController()..selectTrip(trip),
      builder: (controller) {
        return Scaffold(
          backgroundColor: theme.scaffoldBackgroundColor,
          appBar: _buildAppBar(theme, controller),
          body: SafeArea(
            child: Column(
              children: [
                // Enhanced Wizard Stepper with Progress Bar
                _buildEnhancedStepper(theme, controller),
                
                const SizedBox(height: AppDimensions.spacingLarge),
                
                // Animated Step Content with Smooth Transitions
                Expanded(
                  child: _buildAnimatedStepContent(controller),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBar(
    ThemeData theme,
    WizardController controller,
  ) {
    return AppBar(
      elevation: 0,
      centerTitle: true,
      title: Column(
        children: [
          Text(
            "حجز الرحلة",
            style: theme.textTheme.titleLarge?.copyWith(
              color: theme.colorScheme.primary,
              fontSize: AppDimensions.fontSizeXXLarge,
            ),
          ),
          Text(
            "الخطوة ${controller.currentStep + 1} من ${steps.length}",
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
      backgroundColor: theme.appBarTheme.backgroundColor,
      iconTheme: theme.appBarTheme.iconTheme,
      leading: controller.currentStep > 0
          ? IconButton(
              tooltip: 'الرجوع للخطوة السابقة',
              onPressed: controller.previousStep,
              icon: const Icon(Icons.arrow_back_rounded),
            )
          : IconButton(
              tooltip: 'إلغاء الحجز',
              onPressed: () => _showCancelDialog(Get.context!),
              icon: const Icon(Icons.close_rounded),
            ),
    );
  }

  Widget _buildEnhancedStepper(ThemeData theme, WizardController controller) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.paddingMedium,
        vertical: AppDimensions.paddingSmall,
      ),
      child: Column(
        children: [
          // Progress Bar
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            tween: Tween(
              begin: 0,
              end: (controller.currentStep + 1) / steps.length,
            ),
            builder: (context, value, child) {
              return Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "${((value * 100).toInt())}% مكتمل",
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        "${controller.currentStep + 1}/${steps.length}",
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: value,
                      minHeight: 8,
                      backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        theme.colorScheme.primary,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          
          const SizedBox(height: AppDimensions.spacingMedium),
          
          // Step Indicators
          WizardStepperHorizontal(
            currentStep: controller.currentStep,
            steps: steps,
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedStepContent(WizardController controller) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      switchInCurve: Curves.easeInOut,
      switchOutCurve: Curves.easeInOut,
      transitionBuilder: (Widget child, Animation<double> animation) {
        return child
            .animate(key: ValueKey(controller.currentStep))
            .fadeIn(duration: 400.ms)
            .slideX(begin: 0.2, end: 0, curve: Curves.easeOutCubic);
      },
      layoutBuilder: (currentChild, previousChildren) {
        return Stack(
          alignment: Alignment.center,
          children: <Widget>[
            ...previousChildren,
            if (currentChild != null) currentChild,
          ],
        );
      },
      child: _buildStepWidget(controller.currentStep, controller),
    );
  }

  Widget _buildStepWidget(int step, WizardController controller) {
    // Key is important for AnimatedSwitcher to detect changes
    Widget stepWidget;
    
    switch (step) {
      case 0:
        stepWidget = PassengerCountStep(key: const ValueKey(0));
        break;
      case 1:
        stepWidget = const PassengerDetailsStep(key: ValueKey(1));
        break;
      case 2:
        stepWidget = const SeatStep(key: ValueKey(2));
        break;
      case 3:
        stepWidget = const BookingSummaryStep(key: ValueKey(3));
        break;
      case 4:
        stepWidget = ConfirmPaymentStep(key: const ValueKey(4));
        break;
      default:
        stepWidget = const SizedBox.shrink(key: ValueKey(-1));
    }

    // Wrap in padding and card for consistency
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.paddingMedium,
      ),
      child: stepWidget,
    );
  }

  void _showCancelDialog(BuildContext context) {
    final theme = Theme.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: theme.colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
        ),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: theme.colorScheme.error, size: 28),
            const SizedBox(width: 12),
            Text(
              'إلغاء الحجز',
              style: theme.textTheme.titleLarge,
            ),
          ],
        ),
        content: Text(
          'هل أنت متأكد من إلغاء عملية الحجز؟ سيتم فقدان جميع البيانات المدخلة.',
          style: theme.textTheme.bodyLarge,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'متابعة الحجز',
              style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              Get.back();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.error,
              foregroundColor: theme.colorScheme.onError,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              ),
            ),
            child: const Text('إلغاء', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

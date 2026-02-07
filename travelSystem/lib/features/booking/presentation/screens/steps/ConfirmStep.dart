import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:travelsystem/features/wallet/presentation/views/wallet_view.dart';

import '../../../../../core/constants/Color.dart';
import '../../../../../core/utils/payment_mapper.dart';
import '../../../../wallet/controller/wallet_controller.dart';
import '../../../controller/WizardController.dart';
import '../../../controller/confirm_payment_controller.dart';

import '../booking_success_screen.dart';


// خطوة تأكيد الدفع - باستخدام GetX
class ConfirmPaymentStep extends StatelessWidget {
  ConfirmPaymentStep({Key? key}) : super(key: key);
  
  final controller = Get.put(ConfirmPaymentController());

  @override
  Widget build(BuildContext context) {
    final WizardController wizard = Get.find<WizardController>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
             Icon(Icons.payment, size: 28, color: Theme.of(context).colorScheme.primary),
             const SizedBox(width: 8),
             Text(
              "الدفع وتأكيد الحجز",
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        SizedBox(height: 20),
        
        // Methods Row
        Row(
          children: [
            Expanded(
              child: _methodButton(
                context,
                PaymentMethodType.kareemi,
                "بنك كريمي",
                Icons.account_balance,
                const Color(0xffE91E63),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _methodButton(
                context,
                PaymentMethodType.jawaly,
                "محفظة جوالي",
                Icons.phone_android,
                const Color(0xff009688),
              ),
            ),
            Expanded(
              child: _methodButton(
                context,
                PaymentMethodType.card,
                "بطاقة دفع",
                Icons.credit_card,
                const Color(0xff673AB7),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _methodButton(
                context,
                PaymentMethodType.ahjazly_wallet,
                "محفظة أحجزلي",
                Icons.account_balance_wallet,
                AppColor.color_primary,
              ),
            ),
          ],
        ),
        
        SizedBox(height: 24),
        
        Expanded(
          child: SingleChildScrollView(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                   BoxShadow(color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.04), blurRadius: 15, offset: const Offset(0, 5))
                ],
                border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Theme.of(context).dividerColor.withOpacity(0.1))
              ),
              child: Obx(() => AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildMethodForm(context),
              )),
            ),
          ),
        ),
        
        SizedBox(height: 16),
        
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 52,
                child: OutlinedButton(
                  onPressed: wizard.previousStep,
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                  ),
                  child: Text("رجوع"),
                ),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 52,
                child: Obx(() => ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle_outline),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Theme.of(context).colorScheme.onPrimary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2
                  ),
                  label: const Text(
                    "تأكيد الدفع",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  onPressed: controller.isFormValid.value
                      ? () => _processPayment(wizard)
                      : null,
                )),
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  void _processPayment(WizardController wizard) async {
      try {
        if (wizard.bookingId == null) {
          final ok = await wizard.createBooking();
          if (!ok) return;
        }

        final okPayment = await wizard.confirmPayment(
          paymentStatus: 'Paid',
          paymentMethod: controller.paymentMethodDbValue,
          transactionId: controller.transactionId,
        );

        if (okPayment) {
          Get.offAll(() => BookingSuccessScreen(
            transactionId: controller.transactionId,
            paymentMethod: controller.paymentMethodDisplayName,
          ));
        }
      } catch (e) {
        Get.snackbar('خطأ', 'حدث خطأ غير متوقع', 
           backgroundColor: Colors.red.withOpacity(0.1), colorText: Colors.red);
      }
  }

  Widget _methodButton(BuildContext context, PaymentMethodType method, String title, IconData icon, Color color) {
    return Obx(() {
      final bool isSelected = controller.selectedPaymentMethod.value == method;
      return GestureDetector(
        onTap: () => controller.selectMethod(method),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 70,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.1) : (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : Theme.of(context).cardTheme.color),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? color : (Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Theme.of(context).dividerColor.withOpacity(0.2)),
              width: isSelected ? 2 : 1
            ),
             boxShadow: isSelected ? [] : [
                BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
             ]
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: isSelected ? color : Theme.of(context).colorScheme.outline, size: 24),
              const SizedBox(height: 4),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isSelected ? color : Theme.of(context).textTheme.bodySmall?.color,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildMethodForm(BuildContext context) {
    if (controller.selectedPaymentMethod.value == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
             Icon(Icons.touch_app, size: 50, color: Theme.of(context).colorScheme.outline.withOpacity(0.3)),
             const SizedBox(height: 16),
             Text(
              "يرجى اختيار طريقة الدفع أعلاه",
              style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.outline),
            ),
          ],
        ),
      );
    }
    
    switch (controller.selectedPaymentMethod.value!) {
      case PaymentMethodType.kareemi:
        return _kareemiForm(context);
      case PaymentMethodType.jawaly:
        return _jawalyForm(context);
      case PaymentMethodType.card:
        return _cardForm(context);
      case PaymentMethodType.ahjazly_wallet:
        return _walletForm(context);
      default:
        return const SizedBox();
    }
  }

  Widget _kareemiForm(BuildContext context) {
    return Column(
      key: ValueKey('kareemi'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoBox(context, "يرجى تحويل مبلغ الحجز إلى حسابنا ثم إدخال رقم الحوالة."),
        const SizedBox(height: 20),
        
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(0.02) : const Color(0xFFF9FAFB), 
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Theme.of(context).dividerColor.withOpacity(0.1))
          ),
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("رقم حساب الشركة", style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 4),
                  SelectableText(
                    controller.bankAccount,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Theme.of(context).colorScheme.primary),
                  ),
                ],
              ),
              Spacer(),
              IconButton(
                icon: const Icon(Icons.copy, size: 20),
                color: Theme.of(context).colorScheme.primary,
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: controller.bankAccount));
                  Get.snackbar("تم النسخ", "تم نسخ رقم الحساب", snackPosition: SnackPosition.BOTTOM, duration: const Duration(seconds: 1));
                },
              ),
            ],
          ),
        ),
        SizedBox(height: 24),
        _buildTextField(
           context: context,
           controller: controller.kareemiController,
           label: "رقم الحوالة (المرجع)",
           icon: Icons.numbers,
           type: TextInputType.number
        ),
      ],
    );
  }

  Widget _jawalyForm(BuildContext context) {
    return Column(
      key: ValueKey('jawaly'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoBox(context, "أدخل رقم الفاتورة أو العملية بعد الدفع عبر محفظة جوالي."),
        const SizedBox(height: 24),
        _buildTextField(
           context: context,
           controller: controller.jawalyController,
           label: "رقم العملية",
           icon: Icons.receipt,
           type: TextInputType.number
        ),
      ],
    );
  }

  Widget _cardForm(BuildContext context) {
    return Column(
      key: ValueKey('card'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoBox(context, "سيتم خصم المبلغ مباشرة من بطاقتك."),
        const SizedBox(height: 24),
        _buildTextField(
           context: context,
           controller: controller.cardNumberController,
           label: "رقم البطاقة",
           icon: Icons.credit_card,
           type: TextInputType.number
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                context: context,
                controller: controller.cardExpiryController,
                label: "MM/YY",
                icon: Icons.calendar_today,
                type: TextInputType.datetime
              ),
            ),
            SizedBox(width: 16),
            Expanded(
              child: _buildTextField(
                context: context,
                controller: controller.cardCvvController,
                label: "CVV",
                icon: Icons.lock_outline,
                type: TextInputType.number
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _walletForm(BuildContext context) {
    final walletCtrl = Get.put(WalletController());
    final wizard = Get.find<WizardController>();
    
    return Column(
      key: ValueKey('wallet'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _infoBox(context, "سيتم خصم المبلغ من رصيد محفظتك في أحجزلي."),
        const SizedBox(height: 24),
        Obx(() {
          if (walletCtrl.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }
          
          final balance = walletCtrl.wallet.value?.balance ?? 0;
          final totalPrice = wizard.totalPrice;
          final isEnough = balance >= totalPrice;
          
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isEnough ? Colors.green.withOpacity(0.05) : Colors.red.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isEnough ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("رصيدك الحالي:", style: TextStyle(fontFamily: 'Cairo')),
                    Text("${NumberFormat('#,##0.00', 'ar_SA').format(balance)} ر.س", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  ],
                ),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("مبلغ الحجز:", style: TextStyle(fontFamily: 'Cairo')),
                    Text("${NumberFormat('#,##0.00', 'ar_SA').format(totalPrice)} ر.س", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.red)),
                  ],
                ),
                if (!isEnough) ...[
                  const SizedBox(height: 16),
                  const Text(
                    "عذراً، رصيدك غير كافٍ لإتمام هذا الحجز.",
                    style: TextStyle(color: Colors.red, fontSize: 12, fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                  ),
                ]
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _infoBox(BuildContext context, String text) {
     final theme = Theme.of(context);
     return Container(
       padding: const EdgeInsets.all(12),
       decoration: BoxDecoration(
         color: theme.colorScheme.primary.withOpacity(0.05),
         borderRadius: BorderRadius.circular(10),
         border: Border.all(color: theme.colorScheme.primary.withOpacity(0.1))
       ),
       child: Row(
         children: [
           Icon(Icons.info, color: theme.colorScheme.primary, size: 20),
           const SizedBox(width: 10),
           Expanded(child: Text(text, style: theme.textTheme.bodyMedium?.copyWith(fontSize: 13))),
         ],
       ),
     );
  }

  Widget _buildTextField({
    required BuildContext context,
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required TextInputType type,
  }) {
    final theme = Theme.of(context);
    return TextField(
      controller: controller,
      keyboardType: type,
      style: theme.textTheme.bodyLarge,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: theme.colorScheme.outline, fontSize: 13),
        prefixIcon: Icon(icon, color: theme.colorScheme.primary.withOpacity(0.6), size: 20),
        filled: true,
        fillColor: theme.brightness == Brightness.dark ? Colors.white.withOpacity(0.02) : const Color(0xFFF0F3FA), 
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide:BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: theme.dividerColor.withOpacity(0.1))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: theme.colorScheme.primary)),
      ),
    );
  }
}

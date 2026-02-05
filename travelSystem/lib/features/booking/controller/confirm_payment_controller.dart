import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/utils/payment_mapper.dart';
import '../../wallet/controller/wallet_controller.dart';
import '../controller/WizardController.dart';

class ConfirmPaymentController extends GetxController {
  final selectedPaymentMethod = Rxn<PaymentMethodType>();
  
  final kareemiController = TextEditingController();
  final jawalyController = TextEditingController();
  final cardNumberController = TextEditingController();
  final cardExpiryController = TextEditingController();
  final cardCvvController = TextEditingController();
  
  // Observable for button state
  final isFormValid = false.obs;
  
  final bankAccount = "10024559001";
  
  @override
  void onInit() {
    super.onInit();
    // Listen to changes to validate form
    kareemiController.addListener(_validateForm);
    jawalyController.addListener(_validateForm);
    cardNumberController.addListener(_validateForm);
    cardExpiryController.addListener(_validateForm);
    cardCvvController.addListener(_validateForm);
    
    // Also validate when method changes
    ever(selectedPaymentMethod, (_) => _validateForm());
  }
  
  @override
  void onClose() {
    // TextEditingControllers are managed by Flutter widgets and GetX. 
    // Manual disposal here often causes "Used after disposed" errors during navigation animations.
    super.onClose();
  }
  
  void selectMethod(PaymentMethodType method) {
    selectedPaymentMethod.value = method;
  }
  
  void _validateForm() {
    if (selectedPaymentMethod.value == null) {
      isFormValid.value = false;
      return;
    }
    
    bool isValid = false;
    switch (selectedPaymentMethod.value!) {
      case PaymentMethodType.kareemi:
        isValid = kareemiController.text.trim().isNotEmpty;
        break;
      case PaymentMethodType.jawaly:
        isValid = jawalyController.text.trim().isNotEmpty;
        break;
      case PaymentMethodType.card:
        isValid = cardNumberController.text.trim().isNotEmpty &&
                 cardExpiryController.text.trim().isNotEmpty &&
                 cardCvvController.text.trim().isNotEmpty;
        break;
      case PaymentMethodType.ahjazly_wallet:
        final walletCtrl = Get.find<WalletController>();
        final wizard = Get.find<WizardController>();
        isValid = (walletCtrl.wallet.value?.balance ?? 0) >= wizard.totalPrice;
        break;
      default:
        isValid = true; // For cash or other methods that don't need extra fields
    }
    isFormValid.value = isValid;
  }
  
  String get paymentMethodDbValue {
    if (selectedPaymentMethod.value == null) return 'cash';
    return PaymentMapper.toDbValue(selectedPaymentMethod.value!);
  }

  String get paymentMethodDisplayName {
    if (selectedPaymentMethod.value == null) return 'غير محدد';
    return PaymentMapper.toDisplayName(selectedPaymentMethod.value!);
  }
  
  String get transactionId {
    if (selectedPaymentMethod.value == null) return '';
    switch (selectedPaymentMethod.value!) {
      case PaymentMethodType.kareemi:
        return kareemiController.text.trim();
      case PaymentMethodType.jawaly:
        return jawalyController.text.trim();
      case PaymentMethodType.card:
        return cardNumberController.text.trim();
      default:
        return '';
    }
  }
}

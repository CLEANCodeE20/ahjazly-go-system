import 'package:get/get.dart';
import 'package:flutter/material.dart';
import '../../supabase_integration/supabase_wallet_service.dart';
import '../../auth/controller/AuthService.dart';
import '../data/models/wallet_model.dart';

class WalletController extends GetxController {
  final SupabaseWalletService _walletService = SupabaseWalletService();
  final AuthService _authService = Get.find<AuthService>();

  final Rx<WalletModel?> wallet = Rx<WalletModel?>(null);
  final RxList<WalletTransactionModel> transactions = <WalletTransactionModel>[].obs;
  final isLoading = true.obs;
  final isSubmitting = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchWalletData();
  }

  Future<void> fetchWalletData() async {
    try {
      isLoading.value = true;
      final userId = _authService.userId;
      if (userId == null) return;

      final walletData = await _walletService.getWallet(userId);
      wallet.value = walletData;

      if (walletData != null) {
        final txs = await _walletService.getTransactions(walletData.walletId);
        transactions.assignAll(txs);
      }
    } finally {
      isLoading.value = false;
    }
  }

  Future<bool> submitWithdrawal({
    required double amount,
    required String bankName,
    required String accountName,
    required String accountNumber,
  }) async {
    if (wallet.value == null) return false;
    
    if (amount > wallet.value!.balance) {
      Get.snackbar('خطأ', 'الرصيد غير كافٍ', backgroundColor: Colors.red.withOpacity(0.1));
      return false;
    }

    try {
      isSubmitting.value = true;
      final success = await _walletService.requestWithdrawal(
        walletId: wallet.value!.walletId,
        amount: amount,
        bankName: bankName,
        accountName: accountName,
        accountNumber: accountNumber,
      );

      if (success) {
        Get.snackbar('تم بنجاح', 'تم تقديم طلب السحب بنجاح وسيتم معالجته قريباً');
        return true;
      } else {
        Get.snackbar('خطأ', 'فشل تقديم الطلب، يرجى المحاولة لاحقاً');
        return false;
      }
    } finally {
      isSubmitting.value = false;
    }
  }
}

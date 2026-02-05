import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../controller/wallet_controller.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/services/theme_service.dart';
import '../../../../core/design_system/design_system.dart';

class WalletView extends StatelessWidget {
  const WalletView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(WalletController());
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('المحفظة الإلكترونية', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: 0,
        foregroundColor: theme.appBarTheme.foregroundColor,
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => Get.find<ThemeService>().switchTheme(),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        return RefreshIndicator(
          onRefresh: controller.fetchWalletData,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // Balance Card
              SliverToBoxAdapter(
                child: _buildBalanceCard(context, controller),
              ),

              // Transactions Header
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 32, 20, 12),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.history, color: theme.colorScheme.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'سجل العمليات',
                        style: TextStyle(
                          fontSize: 20, 
                          fontWeight: FontWeight.bold, 
                          fontFamily: 'Cairo',
                          color: isDark ? Colors.white : AppColor.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Transactions List
              if (controller.transactions.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.wallet_outlined, 
                          size: 64, 
                          color: isDark ? Colors.white30 : Colors.grey.shade300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'لا توجد عمليات سابقة', 
                          style: TextStyle(
                            fontFamily: 'Cairo', 
                            fontSize: 16,
                            color: isDark ? Colors.white54 : Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final tx = controller.transactions[index];
                      return _buildTransactionItem(context, tx);
                    },
                    childCount: controller.transactions.length,
                  ),
                ),
              
              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildBalanceCard(BuildContext context, WalletController controller) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: isDark 
          ? const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF312E81)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            )
          : LinearGradient(
              colors: [AppColors.primary, AppColors.primaryDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'الرصيد الحالي',
                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14, fontFamily: 'Cairo'),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${NumberFormat('#,##0.00', 'ar_SA').format(controller.wallet.value?.balance ?? 0)} ${controller.wallet.value?.currency ?? 'ر.س'}',
            style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
          ),
          const SizedBox(height: 28),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: 'طلب سحب',
                  icon: Icons.arrow_downward,
                  size: ButtonSize.medium,
                  variant: ButtonVariant.primary,
                  onPressed: () => _showWithdrawDialog(context, controller),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: AppButton(
                  text: 'شحن الرصيد',
                  icon: Icons.add,
                  size: ButtonSize.medium,
                  variant: ButtonVariant.outlined,
                  onPressed: () {}, // TODO: Top up logic
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: AppTiming.medium).slideY(begin: 0.2, end: 0);
  }

  Widget _buildTransactionItem(BuildContext context, dynamic tx) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isPositive = tx.amount > 0;
    IconData icon;
    Color color;
    String label;

    switch (tx.type) {
      case 'deposit':
        icon = Icons.arrow_downward;
        color = AppColors.success;
        label = 'استرداد / إيداع';
        break;
      case 'payment':
        icon = Icons.arrow_upward;
        color = AppColors.error;
        label = 'دفع حجز';
        break;
      case 'withdrawal':
        icon = Icons.arrow_upward;
        color = AppColors.warning;
        label = 'سحب نقدي';
        break;
      default:
        icon = Icons.swap_horiz;
        color = theme.colorScheme.primary;
        label = 'تسوية';
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: isDark 
              ? Colors.black.withOpacity(0.2) 
              : Colors.black.withOpacity(0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: isDark 
            ? const Color(0xFF334155) 
            : const Color(0xFFF0F2F8),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label, 
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    fontFamily: 'Cairo',
                    fontSize: 15,
                    color: isDark ? Colors.white : AppColor.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${tx.createdAt.day}/${tx.createdAt.month}/${tx.createdAt.year}',
                  style: TextStyle(
                    fontSize: 12, 
                    color: isDark ? Colors.white54 : AppColor.textSecondary,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isPositive ? '+' : ''}${NumberFormat('#,##0.00', 'ar_SA').format(tx.amount)} ر.س',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isPositive ? AppColors.success : AppColors.error,
                  fontFamily: 'Cairo',
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'الرصيد: ${NumberFormat('#,##0.00', 'ar_SA').format(tx.newBalance)}',
                style: TextStyle(
                  fontSize: 11, 
                  color: isDark ? Colors.white38 : Colors.grey,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: AppTiming.fast).slideX(begin: 0.1, end: 0);
  }

  void _showWithdrawDialog(BuildContext context, WalletController controller) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final amountController = TextEditingController();
    final bankController = TextEditingController();
    final nameController = TextEditingController();
    final accountController = TextEditingController();

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: isDark 
                ? Colors.black.withOpacity(0.4) 
                : Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with close button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'طلب سحب رصيد نقدي',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: isDark ? Colors.white70 : Colors.grey),
                    onPressed: Get.back,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'سيتم تحويل المبلغ لحسابك البنكي خلال 3-5 أيام عمل.',
                style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.grey, fontFamily: 'Cairo'),
              ),
              const SizedBox(height: 32),
              _buildInput(context, amountController, 'المبلغ المراد سحبه', Icons.money, TextInputType.number),
              _buildInput(context, bankController, 'اسم البنك / المحفظة', Icons.account_balance),
              _buildInput(context, nameController, 'اسم صاحب الحساب', Icons.person),
              _buildInput(context, accountController, 'رقم الحساب / الآيبان', Icons.numbers),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 58,
                child: Obx(() => AppButton(
                  text: 'تأكيد الطلب',
                  size: ButtonSize.medium,
                  variant: ButtonVariant.primary,
                  icon: Icons.check_circle_outline,
                  onPressed: controller.isSubmitting.value ? null : () async {
                    final success = await controller.submitWithdrawal(
                      amount: double.tryParse(amountController.text) ?? 0,
                      bankName: bankController.text,
                      accountName: nameController.text,
                      accountNumber: accountController.text,
                    );
                    if (success) Get.back();
                  },
                  isLoading: controller.isSubmitting.value,
                )),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      isScrollControlled: true,
    );
  }

  Widget _buildInput(BuildContext context, TextEditingController controller, String label, IconData icon, [TextInputType? type]) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: AppInputField(
        label: label,
        hintText: 'أدخل $label',
        controller: controller,
        keyboardType: type,
        prefixIcon: Icon(icon),
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:travelsystem/features/wallet/presentation/views/wallet_view.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../core/constants/nameRoute.dart';

import '../../../wallet/controller/wallet_controller.dart';
import 'HeroChip.dart';

class UserHeroCard extends StatelessWidget {
  final String userName;
  final String email;
  final bool isGuest;

  const UserHeroCard({
    required this.userName,
    required this.email,
    required this.isGuest,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.all(AppDimensions.paddingLarge),
      decoration: BoxDecoration(
        gradient: isDark 
          ? const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF312E81)], // Indigo Gradient
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            )
          : AppGradients.primaryGradient,
        borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
        boxShadow: [
          BoxShadow(
            color: (isDark ? Colors.black : AppColor.primary).withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'مرحباً 👋',
            style: AppTextStyles.subtitle.copyWith(
              color: Colors.white.withOpacity(0.8),
            ),
          ),
          SizedBox(height: AppDimensions.spacingXSmall),
          Text(
            userName,
            style: AppTextStyles.headline.copyWith(
              color: Colors.white,
              fontSize: 26,
            ),
          ),
          SizedBox(height: AppDimensions.spacingSmall),
          Row(
            children: [
              const Icon(Icons.email_outlined, color: Colors.white, size: 18),
              SizedBox(width: AppDimensions.spacingXSmall),
              Expanded(
                child: Text(
                  email,
                  style: AppTextStyles.body.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: AppDimensions.spacingLarge),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                HeroChip(
                  icon: Icons.star_rounded,
                  label: isGuest ? 'وضع الضيف' : ' موثق',
                ),
                SizedBox(width: AppDimensions.spacingSmall),
                !isGuest?  HeroChip(
                  icon: Icons.account_circle_outlined,
                  label: 'تعديل ',
                  onTap: () => Get.toNamed(AppRoute.EditProfilePage),
                ):SizedBox(height: 2,),

                SizedBox(width: AppDimensions.spacingSmall),
              !isGuest?  HeroChip(
                  icon: Icons.directions_bus_filled_outlined,
                  label: 'إدارة الحجوزات',
                  onTap: () => Get.toNamed(AppRoute.Reservations),
                ):SizedBox(height: 2,),

                if (!isGuest) ...[
                  SizedBox(width: AppDimensions.spacingSmall),
                  Obx(() {
                    final walletCtrl = Get.find<WalletController>();
                    return HeroChip(
                      icon: Icons.account_balance_wallet_outlined,
                      label: 'المحفظة: ${NumberFormat('#,##0.00', 'ar_SA').format(walletCtrl.wallet.value?.balance ?? 0)} ر.س',
                      onTap: () => Get.toNamed(AppRoute.WalletPage),
                    );
                  }),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
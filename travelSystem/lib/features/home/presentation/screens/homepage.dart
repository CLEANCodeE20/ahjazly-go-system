import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/constants/Color.dart';
import 'package:travelsystem/core/constants/dimensions.dart';
import 'package:travelsystem/core/constants/nameRoute.dart';


import '../../../../core/data/static/DataQuickActions.dart';
import '../../../../core/functions/showLogoutDialog.dart';
import '../../../auth/controller/AuthService.dart';
import '../../../profile/presentation/widgets/ActionCard.dart';
import '../../../profile/presentation/widgets/SectionHeader.dart';
import '../../../profile/presentation/widgets/user_hero_card.dart';
import '../../data/models/HomeAction.dart';
import '../../../../shared/widgets/language_bottom_sheet.dart';


class Homepage extends StatelessWidget {
  const Homepage({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Get.find<AuthService>();
    final userName = authService.userName ?? '93'.tr;
    final userEmail = authService.userEmail ?? '94'.tr;
    final usersttus=authService.isGuest;
    final helpCards = [
      HomeAction(
        icon: Icons.question_answer,
        title: '95', // 95: FAQs
        subtitle: '96',
        background: Theme.of(context).colorScheme.surface,
        onTap: () => Get.toNamed(AppRoute.SupportAndHelp),
      ),
      HomeAction(
        icon: Icons.logout_rounded,
        title: '97', // 97: Logout
        subtitle: '98',
        background: Theme.of(context).colorScheme.surface,
        onTap: () => showLogoutDialog(context),
      ),
    ];

    // --- New: Switch to Driver Mode (Only for Drivers) ---
    if (authService.userType == 'driver') {
      helpCards.insert(0, HomeAction(
        icon: Icons.local_taxi_rounded,
        title: 'التبديل لوضع السائق',
        subtitle: 'العودة للوحة تحكم السائق',
        background: Theme.of(context).colorScheme.primaryContainer,
        onTap: () => Get.offAllNamed(AppRoute.DriverDashboard),
      ));
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: AppDimensions.paddingMedium,
                  vertical: AppDimensions.paddingMedium,
                ),
                child: UserHeroCard(
                  userName: userName,
                  email: userEmail,
                  isGuest: authService.isGuest,
                ),
              ),
            ),
            SliverPadding(
              padding: EdgeInsets.symmetric(
                horizontal: AppDimensions.paddingMedium,
                vertical: AppDimensions.paddingSmall,
              ),
              sliver: SliverToBoxAdapter(
                child: SectionHeader(title: '99'.tr),
              ),
            ),
            SliverPadding(
              padding: EdgeInsets.symmetric(
                horizontal: AppDimensions.paddingMedium,
              ),
              sliver: SliverToBoxAdapter(
                child: Wrap(
                  spacing: AppDimensions.spacingSmall,
                  runSpacing: AppDimensions.spacingSmall,
                  children: quickActions
                      .map((action) => ActionCard(action: action))
                      .toList(),
                ),
              ),
            ),
            SliverPadding(
              padding: EdgeInsets.symmetric(
                horizontal: AppDimensions.paddingMedium,
                vertical: AppDimensions.paddingLarge,
              ),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                     SectionHeader(title: '100'.tr),
                    SizedBox(height: AppDimensions.spacingSmall),
                    ...helpCards
                        .map((action) => ActionCard(
                      action: action,
                      isFullWidth: true,
                    ))
                        .toList(),
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




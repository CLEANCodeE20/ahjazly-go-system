import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../shared/widgets/language_bottom_sheet.dart';
import 'package:travelsystem/features/home/data/models/HomeAction.dart';

import '../../constants/Color.dart';
import '../../constants/nameRoute.dart';

List<HomeAction> quickActions = [
  HomeAction(
    icon: Icons.language,
    title: '101',
    subtitle: '102',
    background: AppColor.primary.withOpacity(0.15),
    onTap: () => showLanguageBottomSheet(),
  ),
  HomeAction(
    icon: Icons.support_agent,
    title: '82',
    subtitle: '103',
    background: AppColor.accent.withOpacity(0.2),
    onTap: () => Get.toNamed(AppRoute.SupportAndHelp),
  ),
  HomeAction(
    icon: Icons.account_balance_wallet_outlined,
    title: 'المحفظة',
    subtitle: 'رصيدك ومدفوعاتك',
    background: AppColor.primary.withOpacity(0.15),
    onTap: () => Get.toNamed(AppRoute.WalletPage),
  ),
  HomeAction(
    icon: Icons.notifications_active_outlined,
    title: '44',
    subtitle: '70',
    background: AppColor.success.withOpacity(0.18),
    onTap: () => Get.toNamed(AppRoute.NotificationSettingsPage),
  ),
  HomeAction(
    icon: Icons.info_outline,
    title: '104',
    subtitle: '105',
    background: AppColor.warning.withOpacity(0.18),
    onTap: () => Get.toNamed(AppRoute.AboutApp),
  ),
];
List<HomeAction> quickActionsservic = [
  HomeAction(
    icon: Icons.campaign,
    title: '106',
    subtitle: '107',
    background: AppColor.primary.withOpacity(0.15),
    onTap: () => Get.toNamed(AppRoute.CancelPoliciesPage),
  ),
  HomeAction(
    icon: Icons.multitrack_audio_sharp,
    title: '90',
    subtitle: '108',
    background: AppColor.accent.withOpacity(0.2),
    onTap: () => Get.toNamed(AppRoute.SupportAndHelp),
  ),
  HomeAction(
    icon: Icons.notifications_active_outlined,
    title: '109',
    subtitle: '110',
    background: AppColor.success.withOpacity(0.18),
    onTap: () => Get.toNamed(AppRoute.notification),
  ),
  HomeAction(
    icon: Icons.info_outline,
    title: '95',
    subtitle: '111',
    background: AppColor.warning.withOpacity(0.18),
    onTap: () => Get.toNamed(AppRoute.FaqPage),
  ),
];
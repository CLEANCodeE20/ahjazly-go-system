import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../../features/common/controller/cancel_policies_controller.dart';
import '../../../../features/common/data/models/cancel_policy_model.dart';

class CancelPoliciesPage extends StatelessWidget {
  const CancelPoliciesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final controller = Get.find<CancelPoliciesController>();

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(() {
        if (controller.isLoading.value) {
          return const _LoadingShimmer();
        }
        if (controller.errorMessage.isNotEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, size: 60, color: Colors.redAccent),
                const SizedBox(height: 15),
                Text(controller.errorMessage.value, style: TextStyle(fontFamily: 'Cairo', color: isDark ? Colors.white70 : Colors.black87)),
              ],
            ),
          );
        }
        if (controller.companies.isEmpty) {
          return Center(
            child: Text('لا توجد سياسات متاحة', style: TextStyle(fontFamily: 'Cairo', color: isDark ? Colors.white70 : Colors.black87)),
          );
        }

        return DefaultTabController(
          length: controller.companies.length,
          child: NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
                SliverAppBar(
                  expandedHeight: 120,
                  pinned: true,
                  backgroundColor: theme.appBarTheme.backgroundColor,
                  elevation: 0,
                  scrolledUnderElevation: 0.5,
                  flexibleSpace: FlexibleSpaceBar(
                    centerTitle: true,
                    title: Text(
                      'سياسات الإلغاء'.tr,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                    background: Container(color: theme.appBarTheme.backgroundColor),
                  ),
                  leading: IconButton(
                    icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : Colors.black, size: 20),
                    onPressed: () => Get.back(),
                  ),
                ),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _SliverTabHeaderDelegate(
                    child: Container(
                      color: theme.appBarTheme.backgroundColor,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Container(
                        height: 50,
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: TabBar(
                          isScrollable: true,
                          physics: const BouncingScrollPhysics(),
                          indicatorSize: TabBarIndicatorSize.tab,
                          indicator: BoxDecoration(
                            color: AppColor.primary,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: AppColor.primary.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          labelColor: Colors.white,
                          unselectedLabelColor: isDark ? Colors.white38 : Colors.grey.shade600,
                          labelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, fontSize: 13),
                          unselectedLabelStyle: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.normal, fontSize: 13),
                          dividerColor: Colors.transparent,
                          tabs: controller.companies
                              .map((c) => Tab(
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      child: Text(c.companyName),
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                    ),
                  ),
                ),
              ];
            },
            body: TabBarView(
              children: controller.companies.map((company) {
                return _PoliciesList(
                  company: company,
                  controller: controller,
                );
              }).toList(),
            ),
          ),
        );
      }),
    );
  }
}

class _SliverTabHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  _SliverTabHeaderDelegate({required this.child});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) => child;

  @override
  double get maxExtent => 66;
  @override
  double get minExtent => 66;
  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}

class _LoadingShimmer extends StatelessWidget {
  const _LoadingShimmer();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.white,
      child: Column(
        children: [
          const SizedBox(height: 140),
          Container(
            height: 50,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15)),
          ),
          const SizedBox(height: 30),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 5,
              itemBuilder: (_, __) => Container(
                height: 100,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PoliciesList extends StatelessWidget {
  final CompanyCancelPolicies company;
  final CancelPoliciesController controller;

  const _PoliciesList({required this.company, required this.controller});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      physics: const BouncingScrollPhysics(),
      itemCount: company.policies.length,
      itemBuilder: (context, index) {
        final policy = company.policies[index];
        return Obx(() {
          final isExpanded = controller.expandedPolicies[company.companyId] == policy.id;
          return _ModernPolicyCard(
            policy: policy,
            isExpanded: isExpanded,
            onTap: () => controller.togglePolicy(company.companyId, policy.id),
          );
        });
      },
    );
  }
}

class _ModernPolicyCard extends StatelessWidget {
  final CancelPolicy policy;
  final bool isExpanded;
  final VoidCallback onTap;

  const _ModernPolicyCard({
    required this.policy,
    required this.isExpanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isExpanded ? AppColor.primary.withOpacity(0.3) : Colors.transparent,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isExpanded ? AppColor.primary.withOpacity(0.08) : Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isExpanded ? AppColor.primary : AppColor.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      _getIconForTitle(policy.title),
                      color: isExpanded ? Colors.white : AppColor.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                          Text(
                            policy.title,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: isExpanded ? FontWeight.bold : FontWeight.w700,
                              color: isDark ? Colors.white : const Color(0xFF1F2937),
                            ),
                          ),
                        if (policy.refundPercentage != null) 
                          Text(
                            'استرجاع حتى ${policy.refundPercentage?.toInt()}%',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 11,
                              color: AppColor.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: isExpanded ? AppColor.primary : (isDark ? Colors.white24 : Colors.grey.shade400),
                    ),
                  ),
                ],
              ),
              if (isExpanded) ...[
                const SizedBox(height: 20),
                const Divider(height: 1),
                const SizedBox(height: 20),
                if (policy.description.isNotEmpty) ...[
                  Text(
                    policy.description,
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 13,
                      height: 1.7,
                      color: isDark ? Colors.white70 : Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
                if (policy.rules != null && policy.rules!.isNotEmpty) ...[
                  Text(
                    'تفاصيل الاسترجاع:',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.02) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
                    ),
                    child: Column(
                      children: policy.rules!.map((rule) {
                        final isLast = policy.rules!.indexOf(rule) == policy.rules!.length - 1;
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            border: isLast ? null : Border(bottom: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'قبل الرحلة بـ ${rule.hoursBeforeTrip} ساعة',
                                style: TextStyle(fontFamily: 'Cairo', fontSize: 13, color: isDark ? Colors.white70 : Colors.black87),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: rule.refundPercentage > 0 
                                      ? (isDark ? Colors.green.withOpacity(0.1) : Colors.green.shade50) 
                                      : (isDark ? Colors.red.withOpacity(0.1) : Colors.red.shade50),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '%${rule.refundPercentage.toInt()}',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: rule.refundPercentage > 0 ? Colors.green.shade700 : Colors.red.shade700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIconForTitle(String title) {
    if (title.contains('24') || title.contains('وقت')) return Icons.timer_outlined;
    if (title.contains('حضور') || title.contains('تأخر')) return Icons.hail_rounded;
    if (title.contains('تعديل') || title.contains('تحويل')) return Icons.published_with_changes_rounded;
    return Icons.gavel_rounded;
  }
}

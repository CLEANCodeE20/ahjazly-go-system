import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../../../auth/controller/AuthService.dart';
import '../../../../core/services/support_ticket_repository.dart';
import '../../../support/controller/support_ticket_controller.dart';
import '../../data/models/support_ticket.dart';

class TicketSubmissionSheet extends StatefulWidget {
  const TicketSubmissionSheet({super.key});

  @override
  State<TicketSubmissionSheet> createState() => _TicketSubmissionSheetState();
}

class _TicketSubmissionSheetState extends State<TicketSubmissionSheet> {


  late final SupportTicketController _controller;

  final List<String> _issueTypes = const [
    'مشكلة في الحجز',
    'مشكلة في الدفع',
    'استفسار عن الرحلة',
    'مشكلة تقنية',
    'شكوى',
    'أخرى',
  ];

  @override
  void initState() {
    super.initState();
    _controller = Get.find<SupportTicketController>();
  }


  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(AppDimensions.radiusXXLarge),
          topRight: Radius.circular(AppDimensions.radiusXXLarge),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.all(AppDimensions.paddingLarge),
          child: Form(
            key:  _controller.formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '115'.tr,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: AppDimensions.fontSizeTitle,
                        fontWeight: FontWeight.bold,
                        color: AppColor.textPrimary,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Get.back(),
                      icon: const Icon(Icons.close),
                      color: AppColor.textSecondary,
                    ),
                  ],
                ),
                SizedBox(height: AppDimensions.spacingLarge),

                Text(
                  '116'.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeMedium,
                    fontWeight: FontWeight.w600,
                    color: AppColor.textPrimary,
                  ),
                ),
                SizedBox(height: AppDimensions.spacingSmall),
                Obx(() {
                  return DropdownButtonFormField<String>(
                    value: _controller.selectedIssueType.value,
                    decoration: InputDecoration(
                      hintText: '117'.tr,
                      hintStyle: TextStyle(
                        fontFamily: 'Cairo',
                        color: AppColor.textSecondary,
                      ),
                      filled: true,
                      fillColor: AppColor.background,
                      border: OutlineInputBorder(
                        borderRadius:
                        BorderRadius.circular(AppDimensions.radiusMedium),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: AppDimensions.paddingMedium,
                        vertical: AppDimensions.paddingSmall,
                      ),
                    ),
                    items: _issueTypes.map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(
                          type,
                          style: const TextStyle(fontFamily: 'Cairo'),
                        ),
                      );
                    }).toList(),
                    onChanged: _controller.setIssueType,
                    validator: (value) {
                      if (value == null) {
                        return '119'.tr;
                      }
                      return null;
                    },
                  );
                }),
                SizedBox(height: AppDimensions.spacingMedium),

                Text(
                  '118'.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeMedium,
                    fontWeight: FontWeight.w600,
                    color: AppColor.textPrimary,
                  ),
                ),
                SizedBox(height: AppDimensions.spacingSmall),
                TextFormField(
                  controller: _controller.titleController,
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontFamily: 'Cairo'),
                  decoration: InputDecoration(
                    hintText: '120'.tr,
                    hintStyle: TextStyle(
                      fontFamily: 'Cairo',
                      color: AppColor.textSecondary,
                    ),
                    filled: true,
                    fillColor: AppColor.background,
                    border: OutlineInputBorder(
                      borderRadius:
                      BorderRadius.circular(AppDimensions.radiusMedium),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                    EdgeInsets.all(AppDimensions.paddingMedium),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'الرجاء إدخال عنوان التذكرة';
                    }
                    return null;
                  },
                ),
                SizedBox(height: AppDimensions.spacingMedium),

                Text(
                 '121'.tr,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: AppDimensions.fontSizeMedium,
                    fontWeight: FontWeight.w600,
                    color: AppColor.textPrimary,
                  ),
                ),
                SizedBox(height: AppDimensions.spacingSmall),
                TextFormField(
                  controller: _controller.descriptionController,
                  textAlign: TextAlign.right,
                  maxLines: 5,
                  style: const TextStyle(fontFamily: 'Cairo'),
                  decoration: InputDecoration(
                    hintText: '122'.tr,
                    hintStyle: TextStyle(
                      fontFamily: 'Cairo',
                      color: AppColor.textSecondary,
                    ),
                    filled: true,
                    fillColor: AppColor.background,
                    border: OutlineInputBorder(
                      borderRadius:
                      BorderRadius.circular(AppDimensions.radiusMedium),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                    EdgeInsets.all(AppDimensions.paddingMedium),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'الرجاء إدخال تفاصيل المشكلة';
                    }
                    return null;
                  },
                ),
                SizedBox(height: AppDimensions.spacingLarge),

                Obx(() {
                  return Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _controller.isLoading.value
                              ? null
                              : () => _controller.reset(),
                          style: OutlinedButton.styleFrom(
                            padding: EdgeInsets.symmetric(
                              vertical: AppDimensions.paddingMedium,
                            ),
                            side: BorderSide(color: AppColor.divider),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                  AppDimensions.radiusMedium),
                            ),
                          ),
                          child: Text(
                            "123".tr,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: AppDimensions.fontSizeLarge,
                              color: AppColor.textSecondary,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: AppDimensions.spacingMedium),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: _controller.isLoading.value
                              ? null
                              : _controller.handleSubmit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColor.primary,
                            padding: EdgeInsets.symmetric(
                              vertical: AppDimensions.paddingMedium,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                  AppDimensions.radiusMedium),
                            ),
                          ),
                          child: _controller.isLoading.value
                              ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                              : Text(
                            "124".tr,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: AppDimensions.fontSizeLarge,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

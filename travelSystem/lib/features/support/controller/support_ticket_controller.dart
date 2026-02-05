import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../auth/controller/AuthService.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';
import '../domain/usecases/create_support_ticket_usecase.dart';
import '../domain/usecases/get_user_tickets_usecase.dart';
import '../domain/entities/support_ticket_entity.dart';

class SupportTicketController extends GetxController {
  final CreateSupportTicketUseCase _createTicketUseCase = Get.find();
  final GetUserTicketsUseCase _getUserTicketsUseCase = Get.find();
  final AuthService authService = Get.find<AuthService>();

  // مفاتيح وكنترولرات الفورم
  final formKey = GlobalKey<FormState>();
  late final TextEditingController titleController;
  late final TextEditingController descriptionController;

  // قيم الحقول (للمنطق)
  final selectedIssueType = RxnString();
  final selectedPriority = 'medium'.obs;
  final title = ''.obs;
  final description = ''.obs;

  // حالة
  final isLoading = false.obs;
  final isFetching = false.obs;
  final errorMessage = ''.obs;
  final myTickets = <SupportTicketEntity>[].obs;

  @override
  void onInit() {
    titleController = TextEditingController();
    descriptionController = TextEditingController();
    fetchTickets();
    super.onInit();
  }

  Future<void> fetchTickets() async {
    final userId = authService.userId;
    if (userId == null) return;

    isFetching.value = true;
    try {
      final result = await _getUserTicketsUseCase(userId.toString());
      
      result.fold(
        (failure) {
          print('Error fetching tickets: $failure');
        },
        (tickets) {
          myTickets.assignAll(tickets);
        },
      );
    } catch (e) {
      print('Error fetching tickets: $e');
    } finally {
      isFetching.value = false;
    }
  }

  // setters
  void setIssueType(String? value) => selectedIssueType.value = value;
  void setPriority(String value) => selectedPriority.value = value;

  void _syncFieldsFromControllers() {
    title.value = titleController.text;
    description.value = descriptionController.text;
  }

  Future<bool> submit(String userId) async {
    if (selectedIssueType.value == null ||
        title.value.trim().isEmpty ||
        description.value.trim().isEmpty) {
      errorMessage.value = 'الرجاء تعبئة جميع الحقول المطلوبة';
      return false;
    }

    isLoading.value = true;
    errorMessage.value = '';

    try {
      final ticket = SupportTicketEntity(
        userId: userId.toString(),
        subject: title.value.trim(),
        description: description.value.trim(),
        status: 'open',
        priority: selectedPriority.value,
        category: selectedIssueType.value,
        createdAt: DateTime.now(),
      );

      final result = await _createTicketUseCase(ticket);
      
      return result.fold(
        (failure) {
          errorMessage.value = 'فشل في إنشاء التذكرة';
          return false;
        },
        (createdTicket) {
          // Refresh tickets list
          fetchTickets();
          return true;
        },
      );
    } catch (e) {
      errorMessage.value = e.toString();
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> handleSubmit() async {
    if (formKey.currentState?.validate() != true) return;

    // جلب userId من AuthService
    final userId = authService.userId;
    if (userId == null) {
      Get.snackbar(
        'خطأ',
        'الرجاء تسجيل الدخول أولاً',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    _syncFieldsFromControllers();

    final ok = await submit(userId);

    if (ok) {
      Get.back();
      Get.snackbar(
        'تم الإرسال',
        'تم إرسال تذكرة الدعم بنجاح',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppColor.success,
        colorText: Colors.white,
        margin: EdgeInsets.all(AppDimensions.marginMedium),
        borderRadius: AppDimensions.radiusMedium,
      );
    } else {
      Get.snackbar(
        'خطأ',
        errorMessage.value.isEmpty
            ? 'تعذر إرسال التذكرة، حاول لاحقاً'
            : errorMessage.value,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  void reset() {
    selectedIssueType.value = null;
    selectedPriority.value = 'medium';
    title.value = '';
    description.value = '';
    titleController.clear();
    descriptionController.clear();
    errorMessage.value = '';
    isLoading.value = false;
    Get.back();
  }

  @override
  void onClose() {
    super.onClose();
  }
}

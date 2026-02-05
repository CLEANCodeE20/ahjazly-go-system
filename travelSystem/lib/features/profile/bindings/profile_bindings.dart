import 'package:get/get.dart';
import '../../common/controller/cancel_policies_controller.dart';
import '../controller/edit_profile_controller.dart';
import '../../common/controller/faq_controller.dart';
import '../controller/notification_settings_controller.dart';
import '../../support/controller/support_ticket_controller.dart';
import '../../support/domain/usecases/create_support_ticket_usecase.dart';
import '../../support/domain/usecases/get_user_tickets_usecase.dart';
import '../../support/domain/repositories/support_repository.dart';

class CancelPoliciesBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<CancelPoliciesController>(() => CancelPoliciesController());
  }
}

class EditProfileBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<EditProfileController>(() => EditProfileController());
  }
}

class FaqBinding extends Bindings {
  @override
  void dependencies() {
    // FaqController and its dependencies are already registered in InjectionContainer
    // No need to re-register here
  }
}

class NotificationSettingsBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<NotificationSettingsController>(() => NotificationSettingsController());
  }
}

class SupportTicketBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => CreateSupportTicketUseCase(Get.find<SupportRepository>()));
    Get.lazyPut(() => GetUserTicketsUseCase(Get.find<SupportRepository>()));
    Get.lazyPut<SupportTicketController>(() => SupportTicketController());
  }
}

class ProfileBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<EditProfileController>(() => EditProfileController());
    Get.lazyPut(() => CreateSupportTicketUseCase(Get.find<SupportRepository>()));
    Get.lazyPut(() => GetUserTicketsUseCase(Get.find<SupportRepository>()));
    Get.lazyPut<SupportTicketController>(() => SupportTicketController());
  }
}

import 'package:get/get.dart';
import '../../core/services/connectivity_engine.dart';
import '../../features/auth/controller/AuthService.dart';
import '../../features/profile/controller/notification_settings_controller.dart';
import '../../features/support/controller/support_ticket_controller.dart';
import '../../features/support/domain/usecases/create_support_ticket_usecase.dart';
import '../../features/support/domain/usecases/get_user_tickets_usecase.dart';
import '../../features/support/domain/repositories/support_repository.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => ConnectivityEngine(), fenix: true);
    Get.lazyPut(() => AuthService(), fenix: true);
    
    // Support dependencies
    Get.lazyPut(() => CreateSupportTicketUseCase(Get.find<SupportRepository>()), fenix: true);
    Get.lazyPut(() => GetUserTicketsUseCase(Get.find<SupportRepository>()), fenix: true);
    Get.lazyPut<SupportTicketController>(
      () => SupportTicketController(),
      fenix: true,
    );
    
    Get.lazyPut<NotificationSettingsController>(
      () => NotificationSettingsController(),
    );
  }
}
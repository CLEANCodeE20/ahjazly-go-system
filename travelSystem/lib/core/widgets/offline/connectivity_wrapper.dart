import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../services/connectivity_engine.dart';
import '../../services/system_settings_service.dart';
import 'no_internet_overlay.dart';
import 'slow_connection_banner.dart';
import '../maintenance_blockade_screen.dart';

class ConnectivityWrapper extends StatelessWidget {
  final Widget child;
  
  const ConnectivityWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final settings = Get.find<SystemSettingsService>();

    // We use a Stack to overlay the offline or maintenance UI over the entire app
    return Stack(
      children: [
        child,
        
        // 1. Maintenance Blockade (Higher Priority than internet)
        Obx(() {
          if (settings.isMaintenanceMode.value) {
            return const MaintenanceBlockadeScreen();
          }
          return const SizedBox.shrink();
        }),

        // 2. Full Overlay for Offline
        Obx(() {
          if (!settings.isMaintenanceMode.value && 
              ConnectivityEngine.to.state.value == ConnectivityState.offline) {
            return const NoInternetOverlay();
          }
          return const SizedBox.shrink();
        }),
        
        // 3. Banner for Slow Connection
        Obx(() {
          if (!settings.isMaintenanceMode.value &&
              ConnectivityEngine.to.state.value == ConnectivityState.slow) {
            return const SlowConnectionBanner();
          }
          return const SizedBox.shrink();
        }),
      ],
    );
  }
}

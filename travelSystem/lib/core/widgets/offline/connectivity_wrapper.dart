import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../services/connectivity_engine.dart';
import 'no_internet_overlay.dart';
import 'slow_connection_banner.dart';

class ConnectivityWrapper extends StatelessWidget {
  final Widget child;
  
  const ConnectivityWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    // We use a Stack to overlay the offline UI over the entire app
    return Stack(
      children: [
        child,
        
        // 1. Full Overlay for Offline
        Obx(() {
          if (ConnectivityEngine.to.state.value == ConnectivityState.offline) {
            return const NoInternetOverlay();
          }
          return const SizedBox.shrink();
        }),
        
        // 2. Banner for Slow Connection
        Obx(() {
          if (ConnectivityEngine.to.state.value == ConnectivityState.slow) {
            return const SlowConnectionBanner();
          }
          return const SizedBox.shrink();
        }),
      ],
    );
  }
}

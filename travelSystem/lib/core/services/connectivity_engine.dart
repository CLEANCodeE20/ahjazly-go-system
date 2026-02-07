import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get/get.dart';

enum ConnectivityState { online, offline, slow, checking }

class ConnectivityEngine extends GetxService {
  static ConnectivityEngine get to => Get.find();

  final Rx<ConnectivityState> state = ConnectivityState.checking.obs;
  final RxBool isOnline = true.obs;
  final RxInt latencyAdjustment = 0.obs;
  
  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _subscription;
  Timer? _timer;

  @override
  void onInit() {
    super.onInit();
    _initMonitoring();
  }

  void _initMonitoring() {
    // 1. Listen to OS connectivity changes
    _subscription = _connectivity.onConnectivityChanged.listen((dynamic results) async {
       ConnectivityResult result;
       if (results is List) {
         // v6+ returns List<ConnectivityResult>
         result = results.isEmpty ? ConnectivityResult.none : results.first;
       } else {
         // Older versions return a single ConnectivityResult
         result = results as ConnectivityResult;
       }

       if (result == ConnectivityResult.none) {
         _updateState(ConnectivityState.offline);
       } else {
         await checkRealInternet();
       }
    });

    // 2. Periodic active check (Adaptive timer)
    _timer = Timer.periodic(const Duration(seconds: 15), (timer) async {
      if (state.value != ConnectivityState.offline) {
        await checkRealInternet();
      }
    });

    // Initial check
    checkRealInternet();
  }

  Future<void> checkRealInternet() async {
    // If we're already checking or we want to avoid excessive calls, we could add a lock.
    // However, accuracy is the priority here.

    final stopwatch = Stopwatch()..start();
    
    // Strategy: Try multiple hosts to avoid false negatives if one service is down/blocked
    bool host1Success = await _tryLookup('google.com');
    bool host2Success = false;

    if (!host1Success) {
      // First check failed, try second host immediately
      host2Success = await _tryLookup('cloudflare.com');
    }

    if (host1Success || host2Success) {
      stopwatch.stop();
      final ms = stopwatch.elapsedMilliseconds;
      latencyAdjustment.value = ms;

      if (ms > 2500) {
        _updateState(ConnectivityState.slow);
      } else {
        _updateState(ConnectivityState.online);
      }
    } else {
      // BOTH hosts failed. Before we alert the user, let's wait a moment and try one last time.
      // This eliminates "blips" or micro-interruptions.
      await Future.delayed(const Duration(milliseconds: 2000));
      
      bool retrySuccess = await _tryLookup('google.com');
      if (retrySuccess) {
        _updateState(ConnectivityState.online);
      } else {
        _updateState(ConnectivityState.offline);
      }
    }
  }

  Future<bool> _tryLookup(String host) async {
    try {
      final result = await InternetAddress.lookup(host).timeout(const Duration(seconds: 4));
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  void _updateState(ConnectivityState newState) {
    if (state.value != newState) {
      // Special logic: Don't flip to offline instantly if we were just online, 
      // the checkRealInternet already handles the 2s delay, so we can trust the 'offline' here.
      state.value = newState;
      isOnline.value = newState != ConnectivityState.offline;
      print('🌐 Connectivity State Finalized: $newState');
    }
  }

  @override
  void onClose() {
    _subscription?.cancel();
    _timer?.cancel();
    super.onClose();
  }
}

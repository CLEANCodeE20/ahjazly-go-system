import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/classes/StatusRequest.dart';
import '../data/static/seat_info.dart';
import 'WizardController.dart';
import '../../../core/utils/error_handler.dart';
import '../domain/usecases/get_available_seats_usecase.dart';

class SeatViewModel extends GetxController {
  final status = StatRequst.Loding.obs;
  
  bool get isLoading => status.value == StatRequst.Loding;
  bool get isError => status.value == StatRequst.fielure || status.value == StatRequst.serverfielure || status.value == StatRequst.oflinefielure;
  bool get isOffline => status.value == StatRequst.noInternet;

  final errorMessage = ''.obs;

  // مقاعد مختارة
  final selectedSeats = <int>[].obs;
  final selectedSeatCodes = <String>[].obs;

  final availableSeatNumbers = <int>[].obs;
  final seatNumberToCode = <int, String>{}.obs;

  // ربط رقم المقعد في التخطيط بـ seat_id
  final seatLayoutNumberToDbId = <int, int>{}.obs;

  // توزيع المقاعد في الباص (Legacy fallback)
  final seatLayoutNumbers = const [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20],
    [21, 22, 23, 24],
    [25, 26, 27, 28],
    [29, 30, 31, 32],
  ];

  late final int tripId;
  late final Map<String, dynamic> customLayout;

  final GetAvailableSeatsUseCase _getAvailableSeatsUseCase = Get.find();

  @override
  void onInit() {
    super.onInit();
    final wizard = Get.find<WizardController>();
    tripId = wizard.tripId;
    customLayout = wizard.trip?.seatLayout ?? {};
    _loadSeats();
    _setupRealtime();
  }

  int _convertSeatCodeToLayoutNumber(String seatCode) {
    if (seatCode.isEmpty) return -1;
    
    // Try to find in custom layout first
    if (customLayout.isNotEmpty) {
      final List cells = customLayout['cells'] ?? [];
      for (var cell in cells) {
        final String label = cell['label']?.toString() ?? '';
        if (label.trim() == seatCode.trim()) {
          return (cell['row'] as int) * 100 + (cell['col'] as int);
        }
      }
    }

    // Fallback: Try to parse as integer
    final numericOnly = seatCode.replaceAll(RegExp(r'[^0-9]'), '');
    if (numericOnly.isNotEmpty) {
      return int.tryParse(numericOnly) ?? -1;
    }
    
    // Last resort: hash the string to a number
    return seatCode.hashCode.abs() % 1000;
  }

  Future<void> _loadSeats() async {
    status.value = StatRequst.Loding;

    final result = await _getAvailableSeatsUseCase(tripId);

    result.fold(
      (failure) {
        status.value = StatRequst.serverfielure;
        errorMessage.value = failure.message;
        ErrorHandler.showError(errorMessage.value, type: ErrorType.server);
      },
      (json) {
        if (json['success'] == true) {
          final List seats = json['seats'] ?? [];
          _processSeatsData(seats);
          _restoreSelectionFromWizard();
          status.value = StatRequst.succes;
        } else {
          status.value = StatRequst.serverfielure;
          errorMessage.value = json['message']?.toString() ?? 'خطأ في جلب المقاعد';
          ErrorHandler.showError(errorMessage.value, type: ErrorType.server);
        }
      },
    );
  }
  
  void _processSeatsData(List seats) {
    seatNumberToCode.clear();
    availableSeatNumbers.clear();
    seatLayoutNumberToDbId.clear();
    
    final tmpAvailable = <int>[];

    for (var e in seats) {
      final int seatId = (e['seat_id'] as num).toInt();
      final bool isAvailable = e['is_available'] == true;
      final String seatCode = e['seat_number'].toString().trim();
      
      final layoutNumber = _convertSeatCodeToLayoutNumber(seatCode);
      if (layoutNumber < 0) continue;

      if (isAvailable) {
        tmpAvailable.add(layoutNumber);
      }
      seatNumberToCode[layoutNumber] = seatCode;
      seatLayoutNumberToDbId[layoutNumber] = seatId;
    }
    availableSeatNumbers.assignAll(tmpAvailable);
  }

  void _restoreSelectionFromWizard() {
    final wizard = Get.find<WizardController>();
    selectedSeats.clear();
    selectedSeatCodes.clear();

    for (var p in wizard.passengers) {
      if (p.seatLayoutNumber != null && p.seatCode != null) {
        selectedSeats.add(p.seatLayoutNumber!);
        selectedSeatCodes.add(p.seatCode!);
      }
    }
  }

  List<List<SeatInfo>> get seatGrid {
    if (customLayout.isNotEmpty && (customLayout['cells'] as List?)?.isNotEmpty == true) {
      final int rows = customLayout['rows'] ?? 1;
      final int cols = customLayout['cols'] ?? 1;
      final List cells = customLayout['cells'] ?? [];

      List<List<SeatInfo>> grid = List.generate(
        rows,
        (r) => List.generate(
          cols,
          (c) => SeatInfo(layoutNumber: null, code: null, type: SeatType.table),
        ),
      );

      for (var cell in cells) {
        final int r = cell['row'] ?? 0;
        final int c = cell['col'] ?? 0;
        final String typeStr = cell['type'] ?? 'empty';
        final String? label = cell['label'];
        final String? seatClass = cell['class'];

        if (r >= rows || c >= cols) continue;

        if (typeStr == 'seat') {
          final layoutNum = r * 100 + c;
          final isAvailable = availableSeatNumbers.contains(layoutNum);
          
          grid[r][c] = SeatInfo(
            layoutNumber: layoutNum,
            code: label,
            type: isAvailable 
                ? (seatClass == 'vip' ? SeatType.premium : SeatType.standard) 
                : SeatType.taken,
          );
        } else if (typeStr == 'aisle') {
          grid[r][c] = SeatInfo(layoutNumber: null, code: null, type: SeatType.table);
        } else if (typeStr == 'driver') {
           grid[r][c] = SeatInfo(layoutNumber: null, code: 'P', type: SeatType.taken);
        }
      }
      return grid;
    }

    // Dynamic Fallback Grid (4 columns)
    final allSeatNumbers = seatNumberToCode.keys.toList()..sort();
    if (allSeatNumbers.isEmpty) return [];

    final int cols = 4;
    final int rows = (allSeatNumbers.length / cols).ceil();
    
    List<List<SeatInfo>> grid = [];
    for (int r = 0; r < rows; r++) {
      List<SeatInfo> row = [];
      for (int c = 0; c < cols; c++) {
        final index = r * cols + c;
        if (index < allSeatNumbers.length) {
          final num = allSeatNumbers[index];
          final isAvailable = availableSeatNumbers.contains(num);
          final code = seatNumberToCode[num];
          row.add(SeatInfo(
            layoutNumber: num, 
            code: code, 
            type: isAvailable ? SeatType.standard : SeatType.taken
          ));
        } else {
          row.add(SeatInfo(layoutNumber: null, code: null, type: SeatType.table));
        }
      }
      grid.add(row);
    }
    return grid;
  }

  void toggleSeat(int layoutNumber) {
    if (!availableSeatNumbers.contains(layoutNumber)) return;

    final wizard = Get.find<WizardController>();
    final totalPassengers = wizard.passengers.length;

    final idx = selectedSeats.indexOf(layoutNumber);
    if (idx >= 0) {
      selectedSeats.removeAt(idx);
      selectedSeatCodes.removeAt(idx);
    } else {
      if (selectedSeats.length >= totalPassengers) {
        ErrorHandler.showInfo('لقد حجزت مقاعد لجميع الركاب ($totalPassengers)');
        return;
      }
      selectedSeats.add(layoutNumber);
      final code = seatNumberToCode[layoutNumber] ?? layoutNumber.toString();
      selectedSeatCodes.add(code);
    }
  }

  void retry() => _loadSeats();

  Future<bool> confirmSeats() async {
    final wizard = Get.find<WizardController>();
    final totalPassengers = wizard.passengers.length;

    if (totalPassengers == 0) {
      ErrorHandler.showWarning('لم يتم تحديد ركاب بعد');
      return false;
    }

    if (selectedSeats.length != totalPassengers) {
      ErrorHandler.showWarning('يجب اختيار مقعد لكل راكب (اخترت ${selectedSeats.length} من $totalPassengers)');
      return false;
    }

    for (int i = 0; i < totalPassengers; i++) {
      final layout = selectedSeats[i];
      final code = selectedSeatCodes[i];
      final dbId = seatLayoutNumberToDbId[layout];
      wizard.assignSeatToPassenger(i, layout, code, seatId: dbId);
    }

    return true;
  }

  RealtimeChannel? _realtimeChannel;

  void _setupRealtime() {
    final supabase = Supabase.instance.client;
    
    _realtimeChannel = supabase.channel('public:passengers:trip=$tripId')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'passengers',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'trip_id',
          value: tripId,
        ),
        callback: (payload) {
          _loadSeats();
        },
      )
      .subscribe();
  }

  @override
  void onClose() {
    _realtimeChannel?.unsubscribe();
    super.onClose();
  }
}

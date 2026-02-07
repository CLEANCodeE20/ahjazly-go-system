import 'package:get/get.dart';
import '../../../core/constants/app_constants.dart';

/// Controller لخطوة اختيار عدد الركاب
class PassengerCountController extends GetxController {
  final adults = 1.obs;
  final children = 0.obs;
  
  /// إجمالي عدد الركاب
  int get totalPassengers => adults.value + children.value;
  
  /// التحقق من صحة البيانات
  bool get isValid => 
      totalPassengers >= AppConstants.minPassengers && 
      totalPassengers <= AppConstants.maxPassengers;
  
  /// رسالة التحقق
  String? get validationMessage {
    if (totalPassengers < AppConstants.minPassengers) {
      return 'يجب اختيار راكب واحد على الأقل';
    }
    if (totalPassengers > AppConstants.maxPassengers) {
      return 'الحد الأقصى ${AppConstants.maxPassengers} ركاب';
    }
    return null;
  }
  
  /// تعيين عدد البالغين
  void setAdults(int value) {
    if (value >= 0 && value <= AppConstants.maxPassengers) {
      adults.value = value;
    }
  }
  
  /// تعيين عدد الأطفال
  void setChildren(int value) {
    if (value >= 0 && totalPassengers + value <= AppConstants.maxPassengers) {
      children.value = value;
    }
  }
  
  /// زيادة عدد البالغين
  void incrementAdults() {
    if (totalPassengers < AppConstants.maxPassengers) {
      adults.value++;
    }
  }
  
  /// إنقاص عدد البالغين
  void decrementAdults() {
    if (adults.value > 0) {
      adults.value--;
    }
  }
  
  /// زيادة عدد الأطفال
  void incrementChildren() {
    if (totalPassengers < AppConstants.maxPassengers) {
      children.value++;
    }
  }
  
  /// إنقاص عدد الأطفال
  void decrementChildren() {
    if (children.value > 0) {
      children.value--;
    }
  }
  
  /// إعادة تعيين القيم
  void reset() {
    adults.value = 1;
    children.value = 0;
  }
}

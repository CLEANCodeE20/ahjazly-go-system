import 'package:get/get.dart';
import '../../../core/usecase/usecase.dart';
import '../data/models/aq_item_model.dart';
import '../domain/usecases/get_faqs_usecase.dart';


class FaqController extends GetxController {
  final GetFAQsUseCase getFAQsUseCase;

  FaqController({required this.getFAQsUseCase});
  
  final faqs = <FaqItem>[].obs;
  final isLoading = false.obs;
  final errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchFromApi();
  }

  Future<void> fetchFromApi() async {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      final result = await getFAQsUseCase(NoParams());
      
      result.fold(
        (failure) {
          errorMessage.value = 'خطأ في جلب الأسئلة الشائعة';
        },
        (faqEntities) {
          faqs.value = faqEntities.map((entity) {
            return FaqItem(
              id: entity.faqId,
              question: entity.question,
              answer: entity.answer,
            );
          }).toList();
        },
      );
    } catch (e) {
      errorMessage.value = 'خطأ في جلب الأسئلة الشائعة: $e';
    } finally {
      isLoading.value = false;
    }
  }

  void toggleExpand(int index) {
    final item = faqs[index];
    item.isExpanded = !item.isExpanded;
    faqs[index] = FaqItem(
      id: item.id,
      question: item.question,
      answer: item.answer,
      isExpanded: item.isExpanded,
    );
  }
}

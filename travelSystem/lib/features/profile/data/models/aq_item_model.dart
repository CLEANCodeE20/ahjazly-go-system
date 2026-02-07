// lib/model/faq_item_model.dart
class FaqItem {
  final int id;
  final String question;
  final String answer;
  bool isExpanded;

  FaqItem({
    required this.id,
    required this.question,
    required this.answer,
    this.isExpanded = false,
  });
}

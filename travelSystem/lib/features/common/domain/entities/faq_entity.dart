import 'package:equatable/equatable.dart';

/// Entity representing a FAQ (Frequently Asked Question)
class FAQEntity extends Equatable {
  final int faqId;
  final String question;
  final String answer;
  final String? category;
  final int displayOrder;
  final bool isActive;
  final DateTime createdAt;

  const FAQEntity({
    required this.faqId,
    required this.question,
    required this.answer,
    this.category,
    required this.displayOrder,
    required this.isActive,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        faqId,
        question,
        answer,
        category,
        displayOrder,
        isActive,
        createdAt,
      ];
}

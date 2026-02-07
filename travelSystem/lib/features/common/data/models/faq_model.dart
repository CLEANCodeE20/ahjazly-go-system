import '../../domain/entities/faq_entity.dart';

/// Model class for FAQ data
class FAQModel extends FAQEntity {
  const FAQModel({
    required super.faqId,
    required super.question,
    required super.answer,
    super.category,
    required super.displayOrder,
    required super.isActive,
    required super.createdAt,
  });

  /// Create model from JSON
  factory FAQModel.fromJson(Map<String, dynamic> json) {
    return FAQModel(
      faqId: json['faq_id'] as int,
      question: json['question'] as String,
      answer: json['answer'] as String,
      category: json['category'] as String?,
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  /// Convert model to JSON
  Map<String, dynamic> toJson() {
    return {
      'faq_id': faqId,
      'question': question,
      'answer': answer,
      if (category != null) 'category': category,
      'display_order': displayOrder,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Convert model to entity
  FAQEntity toEntity() {
    return FAQEntity(
      faqId: faqId,
      question: question,
      answer: answer,
      category: category,
      displayOrder: displayOrder,
      isActive: isActive,
      createdAt: createdAt,
    );
  }
}

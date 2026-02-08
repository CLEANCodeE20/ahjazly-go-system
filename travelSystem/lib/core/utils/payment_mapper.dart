enum PaymentMethodType { kareemi, jawaly, card, cash, bank_transfer, wallet, stc_pay, ahjazly_wallet }

class PaymentMapper {
  /// تحويل النوع إلى القيمة المتوقعة في قاعدة البيانات
  static String toDbValue(PaymentMethodType type) {
    switch (type) {
      case PaymentMethodType.kareemi:
      case PaymentMethodType.bank_transfer:
        return 'bank_transfer';
      case PaymentMethodType.jawaly:
      case PaymentMethodType.wallet:
      case PaymentMethodType.ahjazly_wallet:
        return 'wallet';
      case PaymentMethodType.card:
        return 'card';
      case PaymentMethodType.stc_pay:
        return 'stc_pay';
      case PaymentMethodType.cash:
      default:
        return 'cash';
    }
  }

  /// الحصول على الاسم العربي للعرض في الواجهات
  static String toDisplayName(dynamic value) {
    String dbValue = '';
    if (value is PaymentMethodType) {
      dbValue = toDbValue(value);
    } else if (value is String) {
      dbValue = value.toLowerCase();
    }

    switch (dbValue) {
      case 'bank_transfer':
        return 'تحويل بنكي (كريمي)';
      case 'wallet':
        return 'محفظة إلكترونية (جوالي)';
      case 'card':
        return 'بطاقة دفع (ماستركارد/فيزا)';
      case 'stc_pay':
        return 'STC Pay';
      case 'ahjazly_wallet':
        return 'محفظة أحجزلي';
      case 'cash':
        return 'دفع نقدي';
      default:
        return 'وسيلة دفع أخرى';
    }
  }

  /// تحويل القيمة القادمة من قاعدة البيانات إلى النوع المناسب
  static PaymentMethodType fromDbValue(String value) {
    switch (value.toLowerCase()) {
      case 'bank_transfer':
        return PaymentMethodType.bank_transfer;
      case 'wallet':
        return PaymentMethodType.wallet;
      case 'card':
        return PaymentMethodType.card;
      case 'stc_pay':
        return PaymentMethodType.stc_pay;
      case 'ahjazly_wallet':
        return PaymentMethodType.ahjazly_wallet;
      case 'cash':
      default:
        return PaymentMethodType.cash;
    }
  }
}

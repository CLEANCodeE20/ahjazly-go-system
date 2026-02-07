class WalletModel {
  final int walletId;
  final String userId;
  final double balance;
  final String currency;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  WalletModel({
    required this.walletId,
    required this.userId,
    required this.balance,
    required this.currency,
    this.createdAt,
    this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      walletId: json['wallet_id'],
      userId: json['auth_id']?.toString() ?? json['user_id']?.toString() ?? '',
      balance: (json['balance'] as num).toDouble(),
      currency: json['currency'] ?? 'ر.س',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }
}

class WalletTransactionModel {
  final int transactionId;
  final int walletId;
  final String type;
  final double amount;
  final double previousBalance;
  final double newBalance;
  final String? referenceId;
  final String? description;
  final DateTime createdAt;

  WalletTransactionModel({
    required this.transactionId,
    required this.walletId,
    required this.type,
    required this.amount,
    required this.previousBalance,
    required this.newBalance,
    this.referenceId,
    this.description,
    required this.createdAt,
  });

  factory WalletTransactionModel.fromJson(Map<String, dynamic> json) {
    return WalletTransactionModel(
      transactionId: json['transaction_id'],
      walletId: json['wallet_id'],
      type: json['type'],
      amount: (json['amount'] as num).toDouble(),
      previousBalance: (json['previous_balance'] as num).toDouble(),
      newBalance: (json['new_balance'] as num).toDouble(),
      referenceId: json['reference_id'],
      description: json['description'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

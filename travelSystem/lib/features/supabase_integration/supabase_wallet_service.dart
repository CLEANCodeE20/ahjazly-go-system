import 'package:supabase_flutter/supabase_flutter.dart';
import '../wallet/data/models/wallet_model.dart';

class SupabaseWalletService {
  final _client = Supabase.instance.client;

  Future<WalletModel?> getWallet(String userId) async {
    try {
      final response = await _client
          .from('wallets')
          .select()
          .eq('auth_id', userId) // Updated to auth_id
          .maybeSingle();

      if (response == null) return null;
      return WalletModel.fromJson(response);
    } catch (e) {
      print('Error fetching wallet: $e');
      return null;
    }
  }

  Future<List<WalletTransactionModel>> getTransactions(int walletId) async {
    try {
      final response = await _client
          .from('wallet_transactions')
          .select()
          .eq('wallet_id', walletId)
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => WalletTransactionModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching transactions: $e');
      return [];
    }
  }

  Future<bool> requestWithdrawal({
    required int walletId,
    required double amount,
    required String bankName,
    required String accountName,
    required String accountNumber,
  }) async {
    try {
      await _client.from('wallet_withdrawal_requests').insert({
        'wallet_id': walletId,
        'amount': amount,
        'bank_name': bankName,
        'account_name': accountName,
        'account_number': accountNumber,
        'status': 'pending',
      });
      return true;
    } catch (e) {
      print('Error requesting withdrawal: $e');
      return false;
    }
  }
}

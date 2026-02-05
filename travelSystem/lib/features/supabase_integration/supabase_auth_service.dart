import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;
import '../../core/supabase/supabase_service.dart';

class SupabaseAuthService extends GetxService {
  final sb.SupabaseClient _client = SupabaseService.to;

  // --- Auth Operations ---

  Future<sb.AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<sb.AuthResponse> signUp(String email, String password, {Map<String, dynamic>? data}) async {
    return await _client.auth.signUp(
      email: email,
      password: password,
      data: data,
    );
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<void> sendPasswordResetEmail(String email) async {
    await _client.auth.resetPasswordForEmail(email);
  }

  Future<sb.AuthResponse> verifyOTP(String email, String token, {sb.OtpType type = sb.OtpType.recovery}) async {
    return await _client.auth.verifyOTP(
      email: email,
      token: token,
      type: type,
    );
  }

  Future<void> updatePassword(String newPassword) async {
    await _client.auth.updateUser(
      sb.UserAttributes(password: newPassword),
    );
  }

  // --- Helpers ---
  sb.User? get currentUser => _client.auth.currentUser;
  bool get isAuthenticated => _client.auth.currentSession != null;
  Stream<sb.AuthState> get authStateChanges => _client.auth.onAuthStateChange;
}

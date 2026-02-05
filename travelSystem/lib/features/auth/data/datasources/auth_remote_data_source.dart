import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';
import '../../../../core/error/exceptions.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String email, String password);
  Future<UserModel> signUp(String email, String password, Map<String, dynamic> data);
  Future<void> logout();
  Future<UserModel?> getCurrentUser();
  Future<void> resetPassword(String email, String code, String newPassword);
  Future<String> checkEmail(String email);
  Future<bool> verifyCode(String email, String code);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final SupabaseClient client;

  AuthRemoteDataSourceImpl(this.client);

  @override
  Future<UserModel> login(String email, String password) async {
    try {
      final response = await client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      if (response.user == null) throw ServerException('User not found');
      
      return await _getUserFromPublicTable(response.user!.id);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<UserModel> signUp(String email, String password, Map<String, dynamic> data) async {
    try {
      final response = await client.auth.signUp(
        email: email,
        password: password,
        data: data,
      );
      
      if (response.user == null) throw ServerException('Signup failed');
      
      // Create public user record if needed
      await _createPublicUser(response.user!.id, email, data);
      
      return await _getUserFromPublicTable(response.user!.id);
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> logout() async {
    await client.auth.signOut();
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    final user = client.auth.currentUser;
    if (user == null) return null;
    return await _getUserFromPublicTable(user.id);
  }

  @override
  Future<void> resetPassword(String email, String code, String newPassword) async {
     try {
       // Enhanced payload to match AuthService.dart logic and ensure compatibility with Edge Function
       await client.functions.invoke(
        'reset-password',
        body: {
          "email": email.trim().toLowerCase(),
          "user_email": email.trim().toLowerCase(),
          // Passing auth_id is tricky here as we only have email. 
          // The checkEmail method can fetch it.
          // However, for password reset, email usually suffices if unique.
          // But to be safe and consistent with AuthService:
          "code": code.trim(),
          "verification_code": code.trim(),
          "token": code.trim(),
          "otp": code.trim(),
          "password": newPassword.trim(),
          "new_password": newPassword.trim(),
        },
      );
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  Future<UserModel> _getUserFromPublicTable(String authId) async {
    final data = await client
        .from('users')
        .select()
        .eq('auth_id', authId)
        .maybeSingle();
    
    if (data == null) throw ServerException('User profile not found in public table');
    return UserModel.fromJson(data);
  }

  Future<void> _createPublicUser(String authId, String email, Map<String, dynamic> data) async {
    await client.from('users').insert({
      'auth_id': authId,
      'email': email,
      'full_name': data['full_name'] ?? email.split('@')[0],
      'phone_number': data['phone_number'] ?? '',
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  @override
  Future<String> checkEmail(String email) async {
    try {
      final data = await client
          .from('users')
          .select('auth_id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
      
      if (data == null) throw ServerException('Email not found');
      return data['auth_id'] as String;
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<bool> verifyCode(String email, String code) async {
    try {
      final data = await client
          .from('users')
          .select('verification_code')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

      if (data == null) return false;
      return data['verification_code']?.toString() == code.trim();
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}

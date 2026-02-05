import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;
import '../../../core/supabase/supabase_service.dart';
import '../../../core/constants/nameRoute.dart';
import '../../../core/utils/app_logger.dart';
import '../../supabase_integration/supabase_auth_service.dart';
import '../../../core/services/secure_storage_service.dart';

enum UserStatus { guest, authenticated, loading }

class AuthService extends GetxService {
  final _storage = GetStorage();
  final _secureStorage = Get.find<SecureStorageService>();
  final _supabaseAuth = Get.find<SupabaseAuthService>();

  final Rx<UserStatus> userStatus = UserStatus.guest.obs;

  // Storage Keys (Kept for compatibility with other parts of the app)
  final String _userStatusKey = 'user_status';
  final String _userIdKey = 'user_id';
  final String _userNameKey = 'user_name';
  final String _userEmailKey = 'user_email';
  final String _userPhoneKey = 'user_phone';
  final String _userTypeKey = 'user_type';
  final String _onboardingKey = 'onboarding_seen';

  @override
  void onInit() {
    super.onInit();
    // 1. Initial State Check
    final session = sb.Supabase.instance.client.auth.currentSession;
    if (session != null) {
      userStatus.value = UserStatus.authenticated;
      _saveUserToStorage(session.user);
    }
    
    // 2. Listen to future changes
    _listenToAuthState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    final idStr = await _secureStorage.read(_userIdKey);
    if (idStr != null) _cachedUserId.value = idStr;
    
    _cachedUserName.value = await _secureStorage.read(_userNameKey);
    _cachedUserEmail.value = await _secureStorage.read(_userEmailKey);
    _cachedUserPhone.value = await _secureStorage.read(_userPhoneKey);
    _cachedUserType.value = await _secureStorage.read(_userTypeKey);
  }

  void _listenToAuthState() {
    _supabaseAuth.authStateChanges.listen((data) {
      final session = data.session;
      if (session != null) {
        userStatus.value = UserStatus.authenticated;
        _saveUserToStorage(session.user);
      } else {
        userStatus.value = UserStatus.guest;
        _clearStorage();
      }
    });
  }

  Future<void> _saveUserToStorage(sb.User user) async {
    try {
      // 1. Get Role and Partner ID (Priority: appMetadata > user_roles table)
      String? role = user.appMetadata?['role']?.toString();
      String? partnerIdStr = user.appMetadata?['partner_id']?.toString();
      
      if (role == null) {
        AppLogger.debug('Role missing in metadata, fetching from user_roles table...');
        final roleData = await sb.Supabase.instance.client
            .from('user_roles')
            .select('role, partner_id')
            .eq('auth_id', user.id)
            .maybeSingle();
        
        if (roleData != null) {
          role = roleData['role']?.toString();
          partnerIdStr = roleData['partner_id']?.toString();
        }
      }

      // 2. Map Role to legacy userType for app compatibility
      // DB Roles: TRAVELER, DRIVER, PARTNER_ADMIN, SUPERUSER, support, etc.
      // App Types: customer, driver, partner, admin
      String userType = 'customer';
      if (role != null) {
        final r = role.toUpperCase();
        if (r == 'DRIVER' || r == 'driver') {
          userType = 'driver';
        } else if (r == 'SUPERUSER' || r == 'admin') {
          userType = 'admin';
        } else if (r == 'PARTNER_ADMIN' || r == 'partner') {
          userType = 'partner';
        } else {
          userType = 'customer'; // Default for TRAVELER or others
        }
      }

      final String realUserId = user.id;
      await _secureStorage.write(_userIdKey, realUserId);
      await _secureStorage.write(_userTypeKey, userType);
      
      // Update in-memory cache
      _cachedUserId.value = realUserId;
      _cachedUserType.value = userType;
      
      AppLogger.success('User session saved. ID: $realUserId, Role: $role, Type: $userType');
      
      // ✅ Register FCM token after identity is confirmed
      await _registerFcmToken();
    } catch (e) {
      AppLogger.error('Error saving user session', error: e);
    }
    
    final String name = user.userMetadata?['full_name'] ?? 'User';
    final String? email = user.email;
    final String phone = user.userMetadata?['phone_number'] ?? '';

    await _secureStorage.write(_userNameKey, name);
    await _secureStorage.write(_userEmailKey, email);
    await _secureStorage.write(_userPhoneKey, phone);
    
    // تحديث بقية الذاكرة النشطة
    _cachedUserName.value = name;
    _cachedUserEmail.value = email;
    _cachedUserPhone.value = phone;

    _storage.write(_userStatusKey, true);
  }

  void updateStoredUserData({String? name, String? phone}) async {
    if (name != null) {
      await _secureStorage.write(_userNameKey, name);
      _cachedUserName.value = name;
    }
    if (phone != null) {
      await _secureStorage.write(_userPhoneKey, phone);
      _cachedUserPhone.value = phone;
    }
    userStatus.refresh();
  }

  Future<void> _createPublicUser(sb.User user, Map<String, dynamic>? data) async {
    try {
      final userData = {
        'auth_id': user.id,
        'email': user.email,
        'full_name': data?['full_name'] ?? user.email?.split('@')[0] ?? 'Unknown',
        'phone_number': data?['phone_number'] ?? '',
        // 'user_type': data?['user_type'] ?? 'customer', // Add if your schema validates this
        // 'gender': data?['gender'], // Add if your schema has this column
        'created_at': DateTime.now().toIso8601String(),
      };
      
      // Remove nulls if any (though keys above handle most)
      // userData.removeWhere((key, value) => value == null);

      await sb.Supabase.instance.client.from('users').insert(userData);
      AppLogger.success('Public user record created successfully');
    } catch (e) {
      AppLogger.error('Error creating public user', error: e);
      throw e; // Rethrow to handle in caller
    }
  }

  void _clearStorage() async {
    await _secureStorage.delete(_userIdKey);
    await _secureStorage.delete(_userNameKey);
    await _secureStorage.delete(_userEmailKey);
    await _secureStorage.delete(_userPhoneKey);
    await _secureStorage.delete(_userTypeKey);
    _storage.write(_userStatusKey, false);
    
    _cachedUserId.value = null;
    _cachedUserName.value = null;
    _cachedUserEmail.value = null;
    _cachedUserPhone.value = null;
    _cachedUserType.value = null;
  }

  bool hasSeenOnboarding() => _storage.read<bool>(_onboardingKey) ?? false;
  Future<void> setOnboardingSeen() async => await _storage.write(_onboardingKey, true);

  // Getters
  bool get isGuest => userStatus.value == UserStatus.guest;
  bool get isAuthenticated => userStatus.value == UserStatus.authenticated;
  bool get isLoading => userStatus.value == UserStatus.loading;

  // IMPORTANT: For Supabase, the auth_id is a UUID. 
  // We should ideally fetch the BIGINT 'user_id' from the public.users table.
  // Note: SecureStorage reads are async. For synchronous access in UI, we might need a reactive variable or FutureBuilder.
  // For now, we will change these to Futures or use a cached value if needed. 
  // However, to minimize refactoring impact, we can keep them as is but they won't work synchronously if we strictly use secure storage.
  // BUT, GetStorage was synchronous. SecureStorage is async.
  // CRITICAL: Changing these getters to Futures will break the entire app.
  // SOLUTION: We will cache these values in memory (variables) after reading them, or use FutureBuilder in UI.
  // Given the constraint of "Implementing Critical Fixes", I will change them to async methods where possible, 
  // but for simple getters used in UI, we might need a synchronous cache initialized on app start.
  
  // Let's implement a simple in-memory cache for these values that is populated onInit.
  final Rx<String?> _cachedUserId = Rx<String?>(null);
  final Rx<String?> _cachedUserName = Rx<String?>(null);
  final Rx<String?> _cachedUserEmail = Rx<String?>(null);
  final Rx<String?> _cachedUserPhone = Rx<String?>(null);
  final Rx<String?> _cachedUserType = Rx<String?>(null);

  String? get userId => _cachedUserId.value;
  String? get userName => _cachedUserName.value;
  String? get userEmail => _cachedUserEmail.value;
  String? get userPhone => _cachedUserPhone.value;
  String? get userType => _cachedUserType.value;
  String? get userToken => sb.Supabase.instance.client.auth.currentSession?.accessToken;
  sb.User? get currentUser => sb.Supabase.instance.client.auth.currentUser;

  // Login
  Future<bool> login(String email, String password) async {
    userStatus.value = UserStatus.loading;
    try {
      await _supabaseAuth.signIn(email, password);
      // ✅ Token will be saved automatically in _saveUserToStorage after userId is confirmed
      return true;
    } catch (e) {
      Get.snackbar("خطأ في الدخول", e.toString());
      userStatus.value = UserStatus.guest;
      return false;
    }
  }

  // Sign Up
  Future<sb.AuthResponse> signUp(String email, String password, {Map<String, dynamic>? data}) async {
    userStatus.value = UserStatus.loading;
    try {
      final response = await _supabaseAuth.signUp(email, password, data: data);
      
      if (response.user != null) {
        try {
           await _createPublicUser(response.user!, data);
        } catch (e) {
          AppLogger.warning('Failed to create public user during signup: $e');
        }
      }

      // Note: If email confirmation is ON, session might be null. 
      // We don't automatically set 'authenticated' here; we rely on _listenToAuthState or manual navigation.
      userStatus.value = UserStatus.guest; 
      return response;
    } catch (e) {
      userStatus.value = UserStatus.guest;
      rethrow;
    }
  }

  // --- Custom Verification Logic (PHP Mirror) ---
  
  Future<void> setVerificationCode(String userId, String code) async {
    try {
      // Assuming 'verification_code' column exists in 'users' table or we add it to metadata for now if not.
      // PHP backend had it in table. Let's try updating table.
      await sb.Supabase.instance.client
          .from('users')
          .update({'verification_code': code})
          .eq('auth_id', userId);
    } catch (e) {
      AppLogger.error('Error setting verification code', error: e);
    }
  }

  Future<bool> verifyCustomCode(String email, String code, {bool clearAfterSuccess = true}) async {
      final cleanEmail = email.trim().toLowerCase();
      final cleanCode = code.trim();
      
      AppLogger.debug('verifyCustomCode - Email: $cleanEmail, Code: $cleanCode');
      
      try {
        // Find user by email
        final data = await sb.Supabase.instance.client
            .from('users')
            .select('user_id, verification_code')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (data == null) {
          AppLogger.warning('verifyCustomCode - User not found for email: $cleanEmail');
          return false;
        }

        final dbCode = data['verification_code']?.toString() ?? '';
        AppLogger.debug('verifyCustomCode - DB Code: $dbCode, Provided Code: $cleanCode');

        if (dbCode == cleanCode) {
           if (clearAfterSuccess) {
             AppLogger.debug('verifyCustomCode - Clearing code from DB');
             await sb.Supabase.instance.client
              .from('users')
              .update({'verification_code': null})
              .eq('user_id', data['user_id']);
           }
           return true; 
        }
        
        AppLogger.warning('verifyCustomCode - Code mismatch!');
        return false;
      } catch(e) {
        AppLogger.error('verifyCustomCode - Exception', error: e);
        return false;
      }
  }

  // Logout
  Future<void> logout() async {
    // 1. Update status immediately to prevent middleware from redirecting back to Home
    userStatus.value = UserStatus.guest;
    
    // 2. Perform actual sign out
    await _supabaseAuth.signOut();
    
    // 3. Clear local storage
    _clearStorage();
    
    // 4. Navigate safely
    Get.offAllNamed(AppRoute.Login);
  }

  // Internal method to register FCM token (called after userId is confirmed)
  Future<void> _registerFcmToken() async {
    AppLogger.debug('_registerFcmToken() called');
    
    final realUserId = userId; // Get the int ID from storage
    AppLogger.debug('userId from storage = $realUserId (type: ${realUserId.runtimeType})');
    
    if (realUserId == null) {
      AppLogger.warning('Cannot register FCM token: userId is null');
      return;
    }

    try {
      AppLogger.debug('Getting FCM token from FirebaseMessaging...');
      final token = await FirebaseMessaging.instance.getToken();
      AppLogger.debug('FCM token retrieved = ${token?.substring(0, 20)}... (length: ${token?.length})');
      
      if (token == null) {
        AppLogger.warning('Cannot register FCM token: FCM token is null');
        return;
      }

      AppLogger.info('Registering FCM token for user $realUserId...');
      
      final payload = {
        'user_id': null, // Deprecated column, keep null or remove
        'auth_id': realUserId, // New column
        'fcm_token': token,
        'device_type': 'android',
        'updated_at': DateTime.now().toIso8601String(),
      };
      
      AppLogger.debug('Payload = $payload');
      AppLogger.debug('Attempting upsert to user_device_tokens...');
      
      final response = await sb.Supabase.instance.client
          .from('user_device_tokens')
          .upsert(payload, onConflict: 'auth_id, fcm_token') // Updated conflict target
          .select();
      
      AppLogger.debug('Upsert response = $response');
      AppLogger.success('FCM token registered successfully!');
    } catch (e, stackTrace) {
      AppLogger.error('FCM Token Save Error', error: e, stackTrace: stackTrace);
      // Don't throw - this is not critical enough to fail login
    }
  }

  // Public method for manual token refresh (can be called from other services)
  Future<void> sendFcmTokenToServer() async {
    await _registerFcmToken();
  }

  // --- For Forgot Password Flow ---

  Future<String?> getUserIdByEmail(String email) async {
    try {
      final data = await sb.Supabase.instance.client
          .from('users')
          .select('auth_id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
      return data?['auth_id'] as String?;
    } catch (e) {
      AppLogger.error('Error in getUserIdByEmail', error: e);
      return null;
    }
  }

  Future<void> setVerificationCodeByEmail(String email, String code) async {
    try {
      await sb.Supabase.instance.client
          .from('users')
          .update({'verification_code': code})
          .eq('email', email.trim().toLowerCase());
    } catch (e) {
      AppLogger.error('Error setting verification code by email', error: e);
    }
  }

  Future<bool> resetPasswordCustom(String email, String code, String newPassword) async {
    final cleanEmail = email.trim().toLowerCase();
    final cleanCode = code.trim();
    final int? numericCode = int.tryParse(cleanCode);
    
    // Fetch auth_id just in case the Edge Function needs it instead of email
    final authId = await getUserIdByEmail(cleanEmail);
    
    AppLogger.debug('resetPasswordCustom - Email: $cleanEmail, Code: $cleanCode, AuthID: $authId');
    
    try {
       // Call Edge Function to securely update password
       // We send an exhaustive list of keys to ensure compatibility with any Edge Function implementation
       final response = await sb.Supabase.instance.client.functions.invoke(
        'reset-password',
        body: {
          "email": cleanEmail,
          "user_email": cleanEmail,
          "auth_id": authId,
          "user_id": authId,
          "code": numericCode ?? cleanCode, // Try sending as number if possible
          "verification_code": numericCode ?? cleanCode,
          "token": cleanCode,
          "otp": cleanCode,
          "password": newPassword.trim(),
          "new_password": newPassword.trim(),
          "confirm_password": newPassword.trim()
        },
      );
      AppLogger.success('resetPasswordCustom - Success: ${response.data}');
      return true;
    } catch (e) {
       AppLogger.error('resetPasswordCustom - Error', error: e);
       if (e is sb.FunctionException) {
         AppLogger.error('resetPasswordCustom - Details: ${e.details}');
       }
       return false;
    }
  }
}


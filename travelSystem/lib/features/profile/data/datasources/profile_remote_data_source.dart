import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile_model.dart';
import '../models/notification_settings_model.dart';

/// Abstract class for profile remote data source
abstract class ProfileRemoteDataSource {
  Future<UserProfileModel> getUserProfile(String userId);
  Future<UserProfileModel> updateProfile(UserProfileModel profile);
  Future<NotificationSettingsModel> getNotificationSettings(String userId);
  Future<NotificationSettingsModel> updateNotificationSettings(
    NotificationSettingsModel settings,
  );
  Future<String> uploadProfileImage(String userId, String filePath);
}

/// Implementation of profile remote data source using Supabase
class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final SupabaseClient supabaseClient;

  ProfileRemoteDataSourceImpl(this.supabaseClient);

  @override
  Future<UserProfileModel> getUserProfile(String userId) async {
    try {
      final response = await supabaseClient
          .from('users')
          .select()
          .eq('auth_id', userId) // Updated to auth_id
          .single();

      return UserProfileModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get user profile: $e');
    }
  }

  @override
  Future<UserProfileModel> updateProfile(UserProfileModel profile) async {
    try {
      final response = await supabaseClient
          .from('users')
          .update({
            'full_name': profile.fullName,
            'phone_number': profile.phone,
            'profile_image': profile.profileImage,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('auth_id', profile.userId) // Updated to auth_id
          .select()
          .single();

      return UserProfileModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }

  @override
  Future<NotificationSettingsModel> getNotificationSettings(
    String userId,
  ) async {
    try {
      final response = await supabaseClient
          .from('notification_settings')
          .select()
          .eq('auth_id', userId) // Updated to auth_id
          .maybeSingle();

      if (response == null) {
        // Create default settings if not exists
        return await _createDefaultNotificationSettings(userId);
      }

      return NotificationSettingsModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to get notification settings: $e');
    }
  }

  @override
  Future<NotificationSettingsModel> updateNotificationSettings(
    NotificationSettingsModel settings,
  ) async {
    try {
      final response = await supabaseClient
          .from('notification_settings')
          .upsert({
            'auth_id': settings.userId, // Updated to auth_id
            'push_enabled': settings.pushEnabled,
            'email_enabled': settings.emailEnabled,
            'sms_enabled': settings.smsEnabled,
            'trip_reminders': settings.tripReminders,
            'promotions': settings.promotions,
            'booking_updates': settings.bookingUpdates,
            'payment_alerts': settings.paymentAlerts,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .select()
          .single();

      return NotificationSettingsModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update notification settings: $e');
    }
  }

  @override
  Future<String> uploadProfileImage(String userId, String filePath) async {
    try {
      final fileName = '$userId-${DateTime.now().millisecondsSinceEpoch}.jpg';
      final path = 'profile-images/$fileName';

      await supabaseClient.storage.from('avatars').upload(
            path,
            File(filePath),
            fileOptions: const FileOptions(upsert: true),
          );

      final publicUrl = supabaseClient.storage.from('avatars').getPublicUrl(path);

      return publicUrl;
    } catch (e) {
      throw Exception('Failed to upload profile image: $e');
    }
  }

  Future<NotificationSettingsModel> _createDefaultNotificationSettings(
    String userId,
  ) async {
    final defaultSettings = NotificationSettingsModel(
      userId: userId,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      tripReminders: true,
      promotions: true,
      bookingUpdates: true,
      paymentAlerts: true,
    );

    return await updateNotificationSettings(defaultSettings);
  }
}

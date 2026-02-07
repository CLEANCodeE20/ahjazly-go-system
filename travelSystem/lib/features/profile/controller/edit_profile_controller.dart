// controller/profile/edit_profile_controller.dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/nameRoute.dart';
import '../../auth/controller/AuthService.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;
import '../domain/usecases/get_user_profile_usecase.dart';
import '../domain/usecases/update_profile_usecase.dart';
import '../domain/repositories/profile_repository.dart';
import '../domain/entities/user_profile_entity.dart';

class EditProfileController extends GetxController {
  final AuthService _authService = Get.find();
  final GetUserProfileUseCase _getUserProfileUseCase = Get.find();
  final UpdateProfileUseCase _updateProfileUseCase = Get.find();
  
  final _picker = ImagePicker();

  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final currentPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  final loading = false.obs;
  final errorMessage = ''.obs;
  final successMessage = ''.obs;
  
  final currentProfile = Rxn<UserProfileEntity>();
  late String userId;

  @override
  void onInit() {
    super.onInit();
    
    // Listen for messages
    ever(errorMessage, (String msg) {
      if (msg.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('خطأ', msg, 
            backgroundColor: Colors.red.withOpacity(0.1),
            colorText: Colors.red,
            snackPosition: SnackPosition.BOTTOM,
          );
        });
      }
    });

    ever(successMessage, (String msg) {
      if (msg.isNotEmpty) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          Get.snackbar('نجاح', msg,
            backgroundColor: Colors.green.withOpacity(0.1),
            colorText: Colors.green,
            snackPosition: SnackPosition.BOTTOM,
          );
        });
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final uid = _authService.userId;
      if (uid == null) {
        Get.snackbar('خطأ', 'يجب تسجيل الدخول أولاً');
        Get.offAllNamed(AppRoute.Login);
        return;
      }
      userId = uid.toString();
      _loadProfile();
    });
  }

  Future<void> _loadProfile() async {
    loading.value = true;
    final result = await _getUserProfileUseCase(userId);
    
    result.fold(
      (failure) {
        errorMessage.value = 'فشل في تحميل البيانات';
      },
      (profile) {
        currentProfile.value = profile;
        nameController.text = profile.fullName;
        emailController.text = profile.email;
        phoneController.text = profile.phone ?? '';
      },
    );
    loading.value = false;
  }

  bool _validate() {
    errorMessage.value = '';
    successMessage.value = '';

    final name = nameController.text.trim();
    final phone = phoneController.text.trim();
    final newPass = newPasswordController.text.trim();
    final confirmPass = confirmPasswordController.text.trim();

    if (name.isEmpty && phone.isEmpty && newPass.isEmpty && confirmPass.isEmpty) {
      errorMessage.value = 'لا يوجد أي تعديل لإرساله';
      return false;
    }

    if (name.isNotEmpty && name.length < 3) {
      errorMessage.value = 'الاسم يجب أن يكون 3 أحرف على الأقل';
      return false;
    }

    if (phone.isNotEmpty && phone.length < 7) {
      errorMessage.value = 'رقم الهاتف غير صالح';
      return false;
    }

    if (newPass.isNotEmpty || confirmPass.isNotEmpty) {
      if (currentPasswordController.text.trim().isEmpty) {
        errorMessage.value = 'أدخل كلمة المرور الحالية قبل تغييرها';
        return false;
      }
      if (newPass.length < 6) {
        errorMessage.value = 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل';
        return false;
      }
      if (newPass != confirmPass) {
        errorMessage.value = 'كلمة المرور الجديدة غير متطابقة';
        return false;
      }
    }

    return true;
  }

  Future<void> submitChanges() async {
    if (!_validate() || currentProfile.value == null) return;

    loading.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
      // Update profile using Use Case
      final updatedProfile = currentProfile.value!.copyWith(
        fullName: nameController.text.trim().isNotEmpty 
            ? nameController.text.trim() 
            : currentProfile.value!.fullName,
        phone: phoneController.text.trim().isNotEmpty 
            ? phoneController.text.trim() 
            : currentProfile.value!.phone,
        updatedAt: DateTime.now(),
      );

      final result = await _updateProfileUseCase(updatedProfile);
      
      result.fold(
        (failure) {
          errorMessage.value = 'فشل في تحديث البيانات';
        },
        (profile) {
          currentProfile.value = profile;
          successMessage.value = 'تم تحديث البيانات بنجاح';
          _authService.updateStoredUserData(
            name: profile.fullName,
            phone: profile.phone,
          );
        },
      );

      // Handle password update separately
      if (newPasswordController.text.trim().isNotEmpty) {
        final response = await sb.Supabase.instance.client.auth.updateUser(
          sb.UserAttributes(
            password: newPasswordController.text.trim(),
          ),
        );
        
        if (response.user != null) {
          successMessage.value += '\nتم تحديث كلمة المرور بنجاح';
          currentPasswordController.clear();
          newPasswordController.clear();
          confirmPasswordController.clear();
        }
      }
      
    } catch (e) {
      errorMessage.value = 'خطأ في التحديث: $e';
    } finally {
      loading.value = false;
    }
  }

  Future<void> pickAndUploadImage() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 70,
      );

      if (image != null) {
        loading.value = true;
        
        // Use repository directly or create a use case
        // For now, using repository implementation via Get.find
        final result = await repository.uploadProfileImage(userId, image.path);
        
        result.fold(
          (failure) {
            errorMessage.value = 'فشل في رفع الصورة';
          },
          (imageUrl) async {
            // Update profile with new image URL
            if (currentProfile.value != null) {
              final updatedProfile = currentProfile.value!.copyWith(profileImage: imageUrl);
              final updateResult = await _updateProfileUseCase(updatedProfile);
              
              updateResult.fold(
                (failure) => errorMessage.value = 'فشل في تحديث رابط الصورة',
                (profile) {
                  currentProfile.value = profile;
                  successMessage.value = 'تم تحديث الصورة الشخصية بنجاح';
                  _authService.updateStoredUserData(); // Just refresh
                },
              );
            }
          },
        );
      }
    } catch (e) {
      errorMessage.value = 'خطأ في اختيار الصورة: $e';
    } finally {
      loading.value = false;
    }
  }

  // Helper to get repository
  ProfileRepository get repository => Get.find<ProfileRepository>();

  @override
  void onClose() {
    super.onClose();
  }
}

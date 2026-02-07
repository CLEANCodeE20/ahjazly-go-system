import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';

/// Helper class for picking and compressing images
class ImagePickerHelper {
  static Future<Uint8List?> pickAndCompressBytes(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile == null) return null;

      Get.dialog(
        const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('جاري معالج الصورة...', style: TextStyle(fontFamily: 'Cairo')),
                ],
              ),
            ),
          ),
        ),
        barrierDismissible: false,
      );

      final compressedBytes = await FlutterImageCompress.compressWithFile(
        pickedFile.path,
        minWidth: 800,
        minHeight: 800,
        quality: 70,
      );

      Get.back();

      return compressedBytes;
    } catch (e) {
      if (Get.isDialogOpen ?? false) Get.back();
      _showErrorSnackbar('حدث خطأ: $e');
      return null;
    }
  }

  /// Pick an image from the specified source, compress it, and return as base64
  /// Returns null if user cancels or an error occurs
  static Future<String?> pickAndCompressImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (pickedFile == null) return null;

      // Show loading indicator
      Get.dialog(
        const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'جاري معالجة الصورة...',
                    style: TextStyle(fontFamily: 'Cairo'),
                  ),
                ],
              ),
            ),
          ),
        ),
        barrierDismissible: false,
      );

      // Compress the image
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        pickedFile.path,
        minWidth: 800,
        minHeight: 800,
        quality: 70,
      );

      // Close loading dialog
      Get.back();

      if (compressedBytes == null) {
        _showErrorSnackbar('فشل ضغط الصورة');
        return null;
      }

      // Convert to base64
      final base64Image = base64Encode(compressedBytes);

      // Check size and warn if large
      final sizeInKB = (base64Image.length * 0.75) / 1024;
      if (sizeInKB > 500) {
        _showWarningSnackbar(
          'حجم الصورة كبير (${sizeInKB.toStringAsFixed(0)} KB). قد يؤثر على سرعة الرفع.',
        );
      }

      _showSuccessSnackbar('تم رفع الصورة بنجاح');
      return base64Image;
    } on Exception catch (e) {
      // Close loading dialog if still open
      if (Get.isDialogOpen ?? false) Get.back();
      _showErrorSnackbar('حدث خطأ أثناء رفع الصورة: ${e.toString()}');
      return null;
    }
  }

  static void _showSuccessSnackbar(String message) {
    Get.snackbar(
      'نجاح',
      message,
      backgroundColor: Colors.green.withOpacity(0.1),
      colorText: Colors.green,
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 2),
    );
  }

  static void _showErrorSnackbar(String message) {
    Get.snackbar(
      'خطأ',
      message,
      backgroundColor: Colors.red.withOpacity(0.1),
      colorText: Colors.red,
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  static void _showWarningSnackbar(String message) {
    Get.snackbar(
      'تنبيه',
      message,
      backgroundColor: Colors.orange.withOpacity(0.1),
      colorText: Colors.orange,
      snackPosition: SnackPosition.BOTTOM,
    );
  }
}

import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/constants/Color.dart';
import '../../../../core/helpers/image_picker_helper.dart';
import '../../../../shared/widgets/app_network_image.dart';
import '../../controller/WizardController.dart';


/// Reusable widget for uploading ID photos with Supabase Storage support
class IdPhotoUploadWidget extends StatefulWidget {
  final int passengerIndex;
  final String? idPhoto; // Can be URL, Base64, or null
  final Function(int index, String urlOrBase64) onPhotoSelected;

  const IdPhotoUploadWidget({
    Key? key,
    required this.passengerIndex,
    required this.idPhoto,
    required this.onPhotoSelected,
  }) : super(key: key);

  @override
  State<IdPhotoUploadWidget> createState() => _IdPhotoUploadWidgetState();
}

class _IdPhotoUploadWidgetState extends State<IdPhotoUploadWidget> {
  bool _isUploading = false;

  @override
  Widget build(BuildContext context) {
    final hasPhoto = widget.idPhoto != null && widget.idPhoto!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: hasPhoto ? AppColor.primary.withOpacity(0.05) : Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasPhoto
              ? AppColor.primary.withOpacity(0.3)
              : Colors.grey.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(hasPhoto),
          if (_isUploading) ...[
            const SizedBox(height: 20),
            const Center(
              child: Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text("جاري رفع الصورة...", style: TextStyle(fontFamily: 'Cairo', fontSize: 12)),
                ],
              ),
            ),
          ] else if (hasPhoto) ...[
            const SizedBox(height: 12),
            _buildImagePreview(),
          ],
          const SizedBox(height: 12),
          _buildActionButtons(hasPhoto),
          if (hasPhoto && !_isUploading) ...[
            const SizedBox(height: 8),
            _buildDeleteButton(),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader(bool hasPhoto) {
    return Row(
      children: [
        Icon(
          hasPhoto ? Icons.check_circle : Icons.camera_alt,
          color: hasPhoto ? AppColor.primary : Colors.grey[600],
          size: 20,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            hasPhoto ? "تم رفع صورة الهوية ✓" : "صورة الهوية (اختياري)",
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: hasPhoto ? AppColor.primary : Colors.grey[700],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImagePreview() {
    final photo = widget.idPhoto!;
    final isUrl = photo.startsWith('http');
    
    return Container(
      height: 120,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColor.primary.withOpacity(0.3)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: isUrl 
          ? AppNetworkImage(
              imageUrl: photo,
              fit: BoxFit.cover,
            )
          : Image.memory(
              base64Decode(photo),
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => _buildErrorIcon(),
            ),
      ),
    );
  }

  Widget _buildErrorIcon() {
    return Center(
      child: Icon(Icons.broken_image, color: Colors.grey[400], size: 40),
    );
  }

  Widget _buildActionButtons(bool hasPhoto) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _isUploading ? null : () => _pickAndUpload(ImageSource.camera),
            icon: const Icon(Icons.camera_alt, size: 18),
            label: Text(hasPhoto ? "إعادة التقاط" : "التقاط صورة"),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColor.primary,
              side: BorderSide(color: AppColor.primary.withOpacity(0.5)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _isUploading ? null : () => _pickAndUpload(ImageSource.gallery),
            icon: const Icon(Icons.photo_library, size: 18),
            label: Text(hasPhoto ? "تغيير" : "من المعرض"),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColor.primary,
              side: BorderSide(color: AppColor.primary.withOpacity(0.5)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDeleteButton() {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: _deletePhoto,
        icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
        label: const Text("حذف الصورة", style: TextStyle(color: Colors.red)),
      ),
    );
  }

  Future<void> _pickAndUpload(ImageSource source) async {
    final bytes = await ImagePickerHelper.pickAndCompressBytes(source);
    if (bytes == null) return;

    setState(() => _isUploading = true);

    try {
      final wizard = Get.find<WizardController>();
      final url = await wizard.uploadPassengerIdPhoto(widget.passengerIndex, bytes);
      
      if (url != null) {
        widget.onPhotoSelected(widget.passengerIndex, url);
        Get.snackbar('نجاح', 'تم رفع الصورة وتخزينها بنجاح', 
          backgroundColor: Colors.green.withOpacity(0.1), colorText: Colors.green);
      }
    } catch (e) {
      Get.snackbar('خطأ', 'حدث خطأ تقني أثناء الرفع', 
        backgroundColor: Colors.red.withOpacity(0.1), colorText: Colors.red);
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _deletePhoto() {
    widget.onPhotoSelected(widget.passengerIndex, '');
    Get.snackbar(
      'تم الحذف',
      'تم حذف صورة الهوية',
      backgroundColor: Colors.orange.withOpacity(0.1),
      colorText: Colors.orange,
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 2),
    );
  }
}

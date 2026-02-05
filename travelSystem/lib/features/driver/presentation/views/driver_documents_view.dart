import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../controller/driver_dashboard_controller.dart';
import '../../controller/driver_documents_controller.dart';
import '../../domain/entities/driver_document_entity.dart';
import '../../../../core/constants/Color.dart';

class DriverDocumentsView extends StatelessWidget {
  const DriverDocumentsView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final documentsController = Get.find<DriverDocumentsController>();
    final dashboardController = Get.find<DriverDashboardController>();
    final driverId = dashboardController.driver.value?.driverId;

    if (driverId != null) {
      documentsController.loadDocuments(driverId);
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Stack(
        children: [
          // Header Background
          Container(
            height: 180,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  AppColor.color_primary,
                  AppColor.color_primary.withOpacity(0.8),
                ],
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: driverId == null
                      ? const Center(child: Text('خطأ في تحميل بيانات السائق'))
                      : Obx(() {
                          if (documentsController.isLoading.value) {
                            return const Center(child: CircularProgressIndicator());
                          }

                          return SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                _buildStatusSummary(documentsController.documents),
                                const SizedBox(height: 20),
                                if (documentsController.documents.isEmpty)
                                  _buildEmptyState()
                                else
                                  ListView.separated(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    itemCount: documentsController.documents.length,
                                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                                    itemBuilder: (context, index) {
                                      final doc = documentsController.documents[index];
                                      return _buildDocumentCard(doc);
                                    },
                                  ),
                                const SizedBox(height: 80), // Space for FAB
                              ],
                            ),
                          );
                        }),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: AppColor.color_secondary.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          onPressed: () => _showUploadDialog(context, driverId!, documentsController),
          label: const Text(
            'رفع مستند جديد',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.white,
            ),
          ),
          icon: const Icon(Icons.add_circle_outline, color: Colors.white),
          backgroundColor: AppColor.color_secondary,
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Get.back(),
            ),
          ),
          const SizedBox(width: 16),
          const Text(
            'المستندات والوثائق',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSummary(List<DriverDocumentEntity> documents) {
    int expiredCount = documents.where((d) => d.verificationStatus == 'expired').length;
    int pendingCount = documents.where((d) => d.verificationStatus == 'pending').length;
    bool allGood = expiredCount == 0 && pendingCount == 0 && documents.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: allGood ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              allGood ? Icons.check_circle : Icons.info_outline,
              color: allGood ? Colors.green : Colors.orange,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  allGood ? 'جميع المستندات سارية' : 'تنبيهات المستندات',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  allGood 
                    ? 'يمكنك متابعة العمل بشكل طبيعي' 
                    : 'لديك $expiredCount مستند منتهي و $pendingCount قيد المراجعة',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Icon(Icons.folder_open, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'لا توجد مستندات مرفوعة',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'قم برفع المستندات المطلوبة لبدء العمل',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentCard(DriverDocumentEntity doc) {
    final status = doc.verificationStatus;
    final type = doc.documentType;
    
    Color statusColor;
    String statusText;
    IconData statusIcon;
    
    switch(status) {
      case 'approved':
        statusColor = Colors.green;
        statusText = 'معتمد';
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = 'مرفوض';
        statusIcon = Icons.cancel;
        break;
      case 'expired':
        statusColor = Colors.orange;
        statusText = 'منتهي';
        statusIcon = Icons.warning;
        break;
      default:
        statusColor = Colors.blue;
        statusText = 'قيد المراجعة';
        statusIcon = Icons.hourglass_empty;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColor.color_primary.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getDocumentIcon(type),
              color: AppColor.color_primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getDocumentTypeLabel(type),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
                if (doc.expiryDate != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 12, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        'ينتهي في: ${DateFormat('yyyy-MM-dd').format(DateTime.parse(doc.expiryDate!))}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(statusIcon, size: 14, color: statusColor),
                const SizedBox(width: 4),
                Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showUploadDialog(BuildContext context, int driverId, DriverDocumentsController controller) async {
    String selectedType = 'license';
    final picker = ImagePicker();
    
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'رفع مستند جديد',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            DropdownButtonFormField<String>(
              value: selectedType,
              items: [
                const DropdownMenuItem(value: 'license', child: Text('رخصة القيادة')),
                const DropdownMenuItem(value: 'national_id', child: Text('الهوية الوطنية')),
                const DropdownMenuItem(value: 'health_certificate', child: Text('شهادة صحية')),
                const DropdownMenuItem(value: 'criminal_record', child: Text('صحيفة السوابق')),
                const DropdownMenuItem(value: 'contract', child: Text('عقد العمل')),
              ],
              onChanged: (val) => selectedType = val!,
              decoration: InputDecoration(
                labelText: 'نوع المستند',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _buildUploadOption(
                    icon: Icons.image,
                    label: 'المعرض',
                    onTap: () async {
                      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
                      if (image != null) {
                        _handleUpload(driverId, image, selectedType, controller);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildUploadOption(
                    icon: Icons.camera_alt,
                    label: 'الكاميرا',
                    onTap: () async {
                      final XFile? image = await picker.pickImage(source: ImageSource.camera);
                      if (image != null) {
                        _handleUpload(driverId, image, selectedType, controller);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: AppColor.color_primary),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleUpload(int driverId, XFile image, String type, DriverDocumentsController controller) async {
    Get.back(); // Close bottom sheet
    Get.dialog(
      const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator(),
          ),
        ),
      ),
      barrierDismissible: false,
    );
    
    final result = await controller.uploadDocument(
      driverId: driverId,
      filePath: image.path,
      fileName: '${type}_${DateTime.now().millisecondsSinceEpoch}.jpg',
      documentType: type,
    );
    
    Get.back(); // Close loading dialog
    
    if (result != null) {
      Get.snackbar(
        'نجاح',
        'تم رفع المستند بنجاح وهو قيد المراجعة',
        backgroundColor: Colors.green,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
      );
    }
  }

  String _getDocumentTypeLabel(String type) {
    switch(type) {
      case 'license': return 'رخصة القيادة';
      case 'national_id': return 'الهوية الوطنية';
      case 'health_certificate': return 'شهادة صحية';
      case 'criminal_record': return 'صحيفة السوابق';
      case 'contract': return 'عقد العمل';
      default: return 'مستند آخر';
    }
  }

  IconData _getDocumentIcon(String type) {
    switch(type) {
      case 'license': return Icons.drive_eta;
      case 'national_id': return Icons.badge;
      case 'health_certificate': return Icons.health_and_safety;
      case 'criminal_record': return Icons.security;
      case 'contract': return Icons.description;
      default: return Icons.insert_drive_file;
    }
  }
}

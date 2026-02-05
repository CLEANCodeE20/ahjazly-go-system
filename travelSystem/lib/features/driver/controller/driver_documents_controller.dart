import 'package:get/get.dart';
import '../domain/usecases/get_driver_documents_usecase.dart';
import '../domain/usecases/upload_driver_document_usecase.dart';
import '../domain/entities/driver_document_entity.dart';
import '../../../core/utils/error_handler.dart';

class DriverDocumentsController extends GetxController {
  final GetDriverDocumentsUseCase _getDriverDocumentsUseCase = Get.find();
  final UploadDriverDocumentUseCase _uploadDriverDocumentUseCase = Get.find();

  final RxList<DriverDocumentEntity> documents = <DriverDocumentEntity>[].obs;
  final isLoading = false.obs;

  Future<void> loadDocuments(int driverId) async {
    try {
      isLoading.value = true;
      final result = await _getDriverDocumentsUseCase(driverId);
      
      result.fold(
        (failure) => ErrorHandler.showError('خطأ في تحميل المستندات: ${failure.message}'),
        (docs) => documents.value = docs,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<DriverDocumentEntity?> uploadDocument({
    required int driverId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? expiryDate,
  }) async {
    final result = await _uploadDriverDocumentUseCase(UploadDriverDocumentParams(
      driverId: driverId,
      filePath: filePath,
      fileName: fileName,
      documentType: documentType,
      expiryDate: expiryDate,
    ));

    return result.fold(
      (failure) {
        ErrorHandler.showError(failure.message);
        return null;
      },
      (doc) {
        loadDocuments(driverId); // Refresh after upload
        return doc;
      },
    );
  }
}

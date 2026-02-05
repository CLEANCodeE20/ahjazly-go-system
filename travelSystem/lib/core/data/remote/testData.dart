import 'package:get/get.dart';
import '../../services/api_service.dart';

class TestData {
  final ApiService _apiService = Get.find();

  Future<dynamic> getdata() async {
    print('getdata called2025');
    try {
      final response = await _apiService.post("/test_endpoint", data: {});
      return response.data;
    } catch (e) {
      return null;
    }
  }
}

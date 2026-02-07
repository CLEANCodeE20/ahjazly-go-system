import 'dart:convert';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

import '../../../auth/controller/AuthService.dart';

class BookingApiService {
  final String baseUrl;
  final AuthService _authService = Get.find();
  BookingApiService({this.baseUrl = 'https://travelsystemoline.onrender.com'});

  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl/api/bookings/create');

    final res = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${_authService.userToken}',
        'Content-Type': 'application/json; charset=utf-8'// إضافة هذا السطر
      },
      body: jsonEncode(body),
    );

    final json = jsonDecode(res.body);
    return {
      'statusCode': res.statusCode,
      'data': json,
    };
  }

  Future<Map<String, dynamic>> updatePayment(Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl/api/payment/update');

    final res = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${_authService.userToken}',
      },
      body: jsonEncode(body),
    );

    final json = jsonDecode(res.body);
    return {
      'statusCode': res.statusCode,
      'data': json,
    };
  }
}

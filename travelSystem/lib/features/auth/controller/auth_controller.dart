// lib/controllers/auth_controller.dart
import 'package:get/get.dart';

class AuthController extends GetxController {
  final isGuest = false.obs;
  final isLogged = false.obs;

  void login() {
    isLogged.value = true;
    isGuest.value = false;
  }

  void guestLogin() {
    isLogged.value = false;
    isGuest.value = true;
  }

  void logout() {
    isLogged.value = false;
    isGuest.value = false;
  }
}

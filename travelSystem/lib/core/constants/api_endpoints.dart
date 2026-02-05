class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = "https://travelsystemoline.onrender.com";
  static const String apiPath = "$baseUrl/api";

  // Auth
  static const String login = "$apiPath/auth/login";
  static const String register = "$baseUrl/public/register.php"; // Mix of structure, but let's keep it here
  static const String saveFcmToken = "$apiPath/fcm/save-token";

  // Bookings
  static const String userBookings = "$apiPath/bookings/user"; // Based on usual naming
  
  // Future endpoints can be added here
}

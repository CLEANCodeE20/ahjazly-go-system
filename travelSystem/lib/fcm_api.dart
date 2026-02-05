import 'package:firebase_messaging/firebase_messaging.dart';

class Fcm{

  intiNotification() async{
     await FirebaseMessaging.instance.requestPermission();
     final fcm_token = await FirebaseMessaging.instance.getToken();
     print(fcm_token);
     FirebaseMessaging.onBackgroundMessage(handelBackgroundMessage);
  }

}
Future <void> handelBackgroundMessage(RemoteMessage message) async {
  
   print("titel ${message.notification?.title}");
   print("body ${message.notification?.body}");
}
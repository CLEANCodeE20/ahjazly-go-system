import 'package:flutter/material.dart';
import 'package:travelsystem/view/screen/OnboradingScreens.dart';
import 'package:animate_do/animate_do.dart'; // إضافة مكتبة الأنيميشن

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState(); // احرص على استدعاء السوبر أولاً
    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (gg) {
        return const OnboradingScreens();
      }));
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: FadeIn(
          duration: Duration(milliseconds: 1800),
          child: Image(image: AssetImage("image/logo.PNG")),
        ),
      ),
    );
  }
}

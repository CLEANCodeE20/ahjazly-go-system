import 'package:flutter/material.dart';

import '../../core/constants/Color.dart';

class NoInternetWidget extends StatelessWidget {
  final VoidCallback onRetry;
  const NoInternetWidget({required this.onRetry});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Image.asset('image/Internet Connection.gif', height: 200, width: 300),
        const SizedBox(height: 20),
        Text("لا يوجد اتصال بالإنترنت", style: TextStyle(fontSize: 19, color: Colors.red, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: onRetry,
          icon: Icon(Icons.refresh, color: Colors.white),
          label: Text("إعادة المحاولة", style: TextStyle(fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
              backgroundColor: AppColor.color_primary,
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 14)
          ),
        ),
      ],
    );
  }
}

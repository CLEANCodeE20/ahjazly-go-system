import 'package:flutter/material.dart';
import 'app_network_image.dart';

class CompanyLogoWidget extends StatelessWidget {
  final String imageUrl;
  const CompanyLogoWidget({super.key, required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(8),
      child: AppNetworkImage(
        imageUrl: imageUrl,
        fit: BoxFit.contain,
      ),
    );
  }
}

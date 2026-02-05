import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';

class SlowConnectionBanner extends StatelessWidget {
  const SlowConnectionBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: FadeInDown(
        duration: const Duration(milliseconds: 400),
        child: Container(
          padding: EdgeInsets.fromLTRB(16, topPadding + 8, 16, 8),
          decoration: BoxDecoration(
            color: Colors.amber.shade700,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Row(
            children: [
              Icon(Icons.wifi_tethering_error_rounded, color: Colors.white, size: 20),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'اتصال الإنترنت ضعيف حالياً',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

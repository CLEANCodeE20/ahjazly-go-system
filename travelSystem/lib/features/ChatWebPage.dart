import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:path/path.dart' as path;
class ChatWebPage extends StatelessWidget {
  const ChatWebPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الدردشة')),
      body: InAppWebView(
        initialUrlRequest: URLRequest(
          url:WebUri ('https://your-fastapi-domain.com/'),
        ),
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
        ),
      ),
    );
  }
}

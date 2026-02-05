import 'package:flutter/material.dart';

class HomeAction {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color background;
  final VoidCallback onTap;

  const HomeAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.background,
    required this.onTap,
  });
}
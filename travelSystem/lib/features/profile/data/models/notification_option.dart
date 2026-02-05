import 'package:flutter/material.dart';

class NotificationOption {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final String category;
  final Color? color;

  NotificationOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.category,
    this.color,
  });
}

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../shared/widgets/app_network_image.dart';

import '../../../../core/constants/Color.dart';
import '../../../../core/constants/dimensions.dart';


class ProfileImageSection extends StatelessWidget {
  final String? imageUrl;
  final String userName;
  final VoidCallback? onEditPressed;

  const ProfileImageSection({
    Key? key,
    this.imageUrl,
    required this.userName,
    this.onEditPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: AppGradients.primaryGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppDimensions.radiusXXLarge),
          bottomRight: Radius.circular(AppDimensions.radiusXXLarge),
        ),
      ),
      child: Column(
        children: [
          SizedBox(height: AppDimensions.paddingLarge),
          Stack(
            children: [
              // Profile Image with border and shadow
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Theme.of(context).colorScheme.surface,
                  border: Border.all(
                    color: Colors.white,
                    width: 4,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 15,
                      spreadRadius: 2,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: AppNetworkImage(
                    imageUrl: imageUrl ?? '',
                    width: 120,
                    height: 120,
                    errorWidget: Icon(
                      Icons.person,
                      size: 60,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
              ),
              // Edit button
              if (onEditPressed != null)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: onEditPressed,
                    child: Container(
                      padding: EdgeInsets.all(AppDimensions.paddingSmall),
                      decoration: BoxDecoration(
                        color: AppColor.accent,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white,
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.camera_alt,
                        size: AppDimensions.iconSizeMedium,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          SizedBox(height: AppDimensions.paddingMedium),
          // User name
          Text(
            userName,
            style: TextStyle(
              fontSize: AppDimensions.fontSizeTitle,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontFamily: 'Cairo',
            ),
          ),
          SizedBox(height: AppDimensions.paddingLarge),
        ],
      ),
    );
  }
}

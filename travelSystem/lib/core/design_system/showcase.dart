// =============================================
// DESIGN SYSTEM SHOWCASE
// Demo screen showcasing all design system components
// =============================================

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:travelsystem/core/services/theme_service.dart';
import 'design_system.dart';

class DesignSystemShowcase extends StatelessWidget {
  const DesignSystemShowcase({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Design System Showcase'),
        actions: [
          IconButton(
            icon: Icon(Get.isDarkMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => Get.find<ThemeService>().switchTheme(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Colors Section
            _buildSectionTitle('Colors'),
            _buildColorsPalette(),
            
            SizedBox(height: AppSpacing.xxl),
            
            // Typography Section
            _buildSectionTitle('Typography'),
            _buildTypographySamples(),
            
            SizedBox(height: AppSpacing.xxl),
            
            // Buttons Section
            _buildSectionTitle('Buttons'),
            _buildButtonSamples(),
            
            SizedBox(height: AppSpacing.xxl),
            
            // Cards Section
            _buildSectionTitle('Cards'),
            _buildCardSamples(),
            
            SizedBox(height: AppSpacing.xxl),
            
            // Inputs Section
            _buildSectionTitle('Input Fields'),
            _buildInputSamples(),
            
            SizedBox(height: AppSpacing.xxl),
            
            // Badges Section
            _buildSectionTitle('Badges'),
            _buildBadgeSamples(),
            
            SizedBox(height: AppSpacing.xxxl),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: AppTypography.headlineSmall,
      textAlign: TextAlign.start,
    );
  }

  Widget _buildColorsPalette() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildColorRow('Primary', AppColors.primary),
        _buildColorRow('Secondary', AppColors.secondary),
        _buildColorRow('Success', AppColors.success),
        _buildColorRow('Warning', AppColors.warning),
        _buildColorRow('Error', AppColors.error),
        _buildColorRow('Info', AppColors.info),
        _buildColorRow('Background', AppColors.background),
        _buildColorRow('Surface', AppColors.surface),
      ],
    );
  }

  Widget _buildColorRow(String name, Color color) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(AppRadius.sm),
              border: Border.all(color: AppColors.border),
            ),
          ),
          SizedBox(width: AppSpacing.md),
          Text(
            name,
            style: AppTypography.bodyMedium,
          ),
          const Spacer(),
          Text(
            '#${color.value.toRadixString(16).substring(2).toUpperCase()}',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypographySamples() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Display Large', style: AppTypography.displayLarge),
        Text('Display Medium', style: AppTypography.displayMedium),
        Text('Display Small', style: AppTypography.displaySmall),
        SizedBox(height: AppSpacing.sm),
        Text('Headline Large', style: AppTypography.headlineLarge),
        Text('Headline Medium', style: AppTypography.headlineMedium),
        Text('Headline Small', style: AppTypography.headlineSmall),
        SizedBox(height: AppSpacing.sm),
        Text('Title Large', style: AppTypography.titleLarge),
        Text('Title Medium', style: AppTypography.titleMedium),
        Text('Title Small', style: AppTypography.titleSmall),
        SizedBox(height: AppSpacing.sm),
        Text('Body Large', style: AppTypography.bodyLarge),
        Text('Body Medium', style: AppTypography.bodyMedium),
        Text('Body Small', style: AppTypography.bodySmall),
      ],
    );
  }

  Widget _buildButtonSamples() {
    return Column(
      children: [
        // Primary Buttons
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            AppButton(
              text: 'Primary Small',
              size: ButtonSize.small,
              variant: ButtonVariant.primary,
            ),
            AppButton(
              text: 'Primary Medium',
              size: ButtonSize.medium,
              variant: ButtonVariant.primary,
            ),
            AppButton(
              text: 'Primary Large',
              size: ButtonSize.large,
              variant: ButtonVariant.primary,
            ),
          ],
        ),
        SizedBox(height: AppSpacing.md),
        
        // Secondary Buttons
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            AppButton(
              text: 'Secondary',
              variant: ButtonVariant.secondary,
            ),
            AppButton(
              text: 'Tertiary',
              variant: ButtonVariant.tertiary,
            ),
            AppButton(
              text: 'Outlined',
              variant: ButtonVariant.outlined,
            ),
          ],
        ),
        SizedBox(height: AppSpacing.md),
        
        // Buttons with Icons
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            AppButton(
              text: 'With Icon',
              icon: Icons.add,
              variant: ButtonVariant.primary,
            ),
            AppButton(
              text: 'Loading',
              isLoading: true,
              variant: ButtonVariant.primary,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCardSamples() {
    return Column(
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sample Card',
                style: AppTypography.titleLarge,
              ),
              SizedBox(height: AppSpacing.sm),
              Text(
                'This is a sample card demonstrating the card component with proper spacing and typography.',
                style: AppTypography.bodyMedium,
              ),
              SizedBox(height: AppSpacing.md),
              AppButton(
                text: 'Action Button',
                size: ButtonSize.small,
                variant: ButtonVariant.primary,
              ),
            ],
          ),
        ),
        SizedBox(height: AppSpacing.md),
        AppCard(
          onTap: () {
            Get.snackbar('Card Tapped', 'You tapped on the card!');
          },
          child: Row(
            children: [
              Icon(Icons.touch_app, size: 40, color: AppColors.primary),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  'Tappable Card',
                  style: AppTypography.titleMedium,
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textTertiary),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInputSamples() {
    return Column(
      children: [
        AppInputField(
          label: 'Default Input',
          hintText: 'Enter text here...',
        ),
        SizedBox(height: AppSpacing.md),
        AppInputField(
          label: 'Email Input',
          hintText: 'your@email.com',
          keyboardType: TextInputType.emailAddress,
          prefixIcon: const Icon(Icons.email),
        ),
        SizedBox(height: AppSpacing.md),
        AppInputField(
          label: 'Password Input',
          hintText: 'Enter password',
          obscureText: true,
          prefixIcon: const Icon(Icons.lock),
        ),
        SizedBox(height: AppSpacing.md),
        AppInputField(
          label: 'Multiline Input',
          hintText: 'Enter detailed text...',
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildBadgeSamples() {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        AppBadge(text: 'Primary', variant: BadgeVariant.primary),
        AppBadge(text: 'Secondary', variant: BadgeVariant.secondary),
        AppBadge(text: 'Success', variant: BadgeVariant.success),
        AppBadge(text: 'Warning', variant: BadgeVariant.warning),
        AppBadge(text: 'Error', variant: BadgeVariant.error),
        AppBadge(text: 'Info', variant: BadgeVariant.info),
        AppBadge(text: 'Small', variant: BadgeVariant.primary, size: BadgeSize.small),
        AppBadge(text: 'Large', variant: BadgeVariant.primary, size: BadgeSize.large),
      ],
    );
  }
}
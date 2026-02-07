# Travel System Design System Migration Guide

## Overview
This guide helps migrate existing Flutter code to use the new unified design system.

## Quick Start

### 1. Import the Design System
```dart
import 'package:travelsystem/core/design_system/design_system.dart';
```

### 2. Replace Hardcoded Values

#### Colors
**Before:**
```dart
Container(color: Color(0xFF9D71BD)) // hardcoded purple
Text(style: TextStyle(color: Colors.grey[600]))
```

**After:**
```dart
Container(color: AppColors.primary)
Text(style: TextStyle(color: AppColors.textSecondary))
```

#### Typography
**Before:**
```dart
Text('Title', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Cairo'))
```

**After:**
```dart
Text('Title', style: AppTypography.titleLarge)
```

#### Spacing
**Before:**
```dart
Padding(padding: EdgeInsets.all(16))
SizedBox(height: 24)
```

**After:**
```dart
Padding(padding: EdgeInsets.all(AppSpacing.md))
SizedBox(height: AppSpacing.lg)
// or using extension
Padding(padding: 2.ps) // 2 * 8px grid = 16px
SizedBox(height: 3.sp) // 3 * 8px = 24px
```

## Component Migration Examples

### Buttons
**Before:**
```dart
ElevatedButton(
  onPressed: () {},
  style: ElevatedButton.styleFrom(
    backgroundColor: Color(0xFF9D71BD),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ),
  child: Text('Submit'),
)
```

**After:**
```dart
AppButton(
  text: 'Submit',
  variant: ButtonVariant.primary,
  size: ButtonSize.medium,
  onPressed: () {},
)
```

### Cards
**Before:**
```dart
Container(
  padding: EdgeInsets.all(20),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)],
  ),
  child: Text('Card Content'),
)
```

**After:**
```dart
AppCard(
  child: Text('Card Content'),
)
```

### Input Fields
**Before:**
```dart
TextField(
  decoration: InputDecoration(
    labelText: 'Email',
    hintText: 'Enter email',
    border: OutlineInputBorder(),
  ),
)
```

**After:**
```dart
AppInputField(
  label: 'Email',
  hintText: 'Enter email',
)
```

## Theme Integration

### Using Theme-Aware Colors
```dart
// Instead of hardcoded colors
Container(
  color: Theme.of(context).colorScheme.primary,
  child: Text(
    'Themed Text',
    style: Theme.of(context).textTheme.titleLarge,
  ),
)
```

### Responsive Design
```dart
// Use breakpoints for responsive layouts
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth < AppBreakpoints.mobile) {
      // Mobile layout
      return Column(children: [...]);
    } else if (constraints.maxWidth < AppBreakpoints.tablet) {
      // Tablet layout
      return Row(children: [...]);
    } else {
      // Desktop layout
      return Row(children: [...]);
    }
  },
)
```

## Migration Checklist

### ✅ Phase 1: Foundation Elements
- [ ] Replace all hardcoded color values with AppColors tokens
- [ ] Replace custom typography with AppTypography styles
- [ ] Replace manual spacing with AppSpacing constants
- [ ] Update border radii to use AppRadius values

### ✅ Phase 2: Components
- [ ] Replace custom buttons with AppButton
- [ ] Replace custom cards with AppCard
- [ ] Replace text fields with AppInputField
- [ ] Replace badges with AppBadge
- [ ] Replace dividers with AppDivider

### ✅ Phase 3: Theme Consistency
- [ ] Ensure all screens respect light/dark theme
- [ ] Update AppBar styling to match design system
- [ ] Verify all interactive elements have proper states
- [ ] Check accessibility contrast ratios

## Common Patterns to Replace

### Custom Containers → AppCard
```dart
// Old pattern
Container(
  margin: EdgeInsets.all(16),
  padding: EdgeInsets.all(20),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    boxShadow: [...],
  ),
)

// New pattern
AppCard(
  padding: EdgeInsets.all(AppSpacing.lg),
  child: YourContent(),
)
```

### Manual Button Styling → AppButton
```dart
// Old pattern
Container(
  height: 48,
  decoration: BoxDecoration(
    color: AppColors.primary,
    borderRadius: BorderRadius.circular(12),
  ),
  child: Center(child: Text('Button')),
)

// New pattern
AppButton(
  text: 'Button',
  size: ButtonSize.medium,
  variant: ButtonVariant.primary,
)
```

## Testing Guidelines

### Visual Testing
- Test all screens in both light and dark modes
- Verify color contrast meets accessibility standards
- Check component states (hover, pressed, disabled)
- Validate responsive behavior across device sizes

### Functional Testing
- Test all interactive components
- Verify form validation and error states
- Check loading and skeleton states
- Validate accessibility features

## Performance Considerations

- Design system components are optimized for performance
- Use const constructors where possible
- Leverage Flutter's built-in optimizations
- Profile app performance after migration

## Getting Help

If you encounter issues during migration:
1. Check the showcase screen for working examples
2. Review the design system documentation
3. Look at existing migrated components for patterns
4. Test incrementally rather than migrating everything at once

## Rollback Strategy

Keep original code commented during migration:
```dart
// OLD CODE - keeping for reference
/*
OriginalWidget(
  // original implementation
)
*/

// NEW CODE - design system version
AppComponent(...)
```

This allows easy rollback if issues arise during the migration process.
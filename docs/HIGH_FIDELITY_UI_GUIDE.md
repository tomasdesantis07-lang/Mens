# High-Fidelity UI Components - Usage Guide

This guide demonstrates how to use the new premium UI components in the MENS app.

---

## 🎯 Components Overview

1. **MensHaptics** - Haptic feedback utility
2. **GlassCard** - Premium glassmorphism card
3. **MensLottie** - Lottie animation wrapper
4. **PrimaryButton** - Button with haptic feedback (enhanced)

---

## 1️⃣ HAPTICS USAGE

### Import
```typescript
import { MensHaptics } from '@/utils/haptics';
```

### Methods

```typescript
// Light feedback - for subtle interactions
MensHaptics.light();

// Medium feedback - standard button presses
MensHaptics.medium();

// Heavy feedback - important actions
MensHaptics.heavy();

// Success feedback - after successful operations
MensHaptics.success();

// Error feedback - for failed operations
MensHaptics.error();

// Warning feedback - for warnings
MensHaptics.warning();

// Selection feedback - for picker changes
MensHaptics.selection();
```

### Example: Custom Success Flow
```typescript
const handleSaveProfile = async () => {
  try {
    await saveUserProfile();
    MensHaptics.success(); // ✅ Success haptic
    navigation.navigate('Home');
  } catch (error) {
    MensHaptics.error(); // ❌ Error haptic
    showErrorAlert();
  }
};
```

---

## 2️⃣ GLASS CARD USAGE

### Import
```typescript
import { GlassCard } from '@/components/common/GlassCard';
```

### Basic Usage
```tsx
<GlassCard style={{ marginBottom: 20 }}>
  <Text style={styles.title}>Premium Content</Text>
  <Text style={styles.description}>
    This card has a glassmorphism effect with subtle gradients
  </Text>
</GlassCard>
```

### Migration Example

**BEFORE:**
```tsx
<View style={[styles.card, { padding: 20 }]}>
  <Text>Content</Text>
</View>
```

**AFTER:**
```tsx
<GlassCard style={{ padding: 20 }}>
  <Text>Content</Text>
</GlassCard>
```

### Customization
```tsx
<GlassCard 
  style={{ 
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
  }}
>
  {/* Your content */}
</GlassCard>
```

---

## 3️⃣ LOTTIE ANIMATIONS USAGE

### Import
```typescript
import { MensLottie } from '@/components/common/MensLottie';
```

### One-time Animation (Success, Completion)
```tsx
<MensLottie 
  source={require('../assets/animations/success.json')}
  loop={false}
  autoPlay={true}
  style={{ width: 150, height: 150 }}
/>
```

### Looping Animation (Loading State)
```tsx
<MensLottie 
  source={require('../assets/animations/loading.json')}
  loop={true}
  speed={1.5}
  style={{ width: 100, height: 100 }}
/>
```

### With Custom Speed
```tsx
<MensLottie 
  source={require('../assets/animations/celebration.json')}
  loop={false}
  speed={0.8} // Slower animation
  style={{ width: 200, height: 200 }}
/>
```

---

## 4️⃣ PRIMARY BUTTON (Enhanced)

### Import
```typescript
import { PrimaryButton } from '@/components/common/PrimaryButton';
```

### Usage
```tsx
<PrimaryButton 
  title="Save Changes"
  onPress={handleSave}
  loading={isSaving}
/>
```

### Features
- ✅ **Automatic haptic feedback** on press
- ✅ Built-in loading state
- ✅ Disabled state handling
- ✅ Consistent styling

---

## 5️⃣ COMPLETE EXAMPLE: Premium Success Screen

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/common/GlassCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { MensLottie } from '@/components/common/MensLottie';
import { MensHaptics } from '@/utils/haptics';
import { COLORS } from '@/theme/theme';

const SuccessScreen = ({ navigation }) => {
  const handleContinue = () => {
    MensHaptics.success();
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <MensLottie 
          source={require('@/assets/animations/trophy.json')}
          loop={false}
          style={styles.animation}
        />
        
        <Text style={styles.title}>Achievement Unlocked!</Text>
        <Text style={styles.description}>
          You've completed your first week of training
        </Text>
        
        <PrimaryButton 
          title="Continue"
          onPress={handleContinue}
          style={styles.button}
        />
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: 32,
  },
  animation: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
});

export default SuccessScreen;
```

---

## 6️⃣ MIGRATION CHECKLIST

### Replace Standard Cards
- [ ] Find all `<View style={styles.card}>` instances
- [ ] Replace with `<GlassCard>`
- [ ] Test visual appearance

### Add Haptic Feedback
- [ ] Identify important user actions
- [ ] Add appropriate haptic calls:
  - `success()` for completions
  - `error()` for failures
  - `light()` for selections

### Integrate Animations
- [ ] Download Lottie JSON files
- [ ] Place in `assets/animations/`
- [ ] Replace static icons with `MensLottie` where appropriate

### Update Buttons
- [ ] Verify all `PrimaryButton` instances work correctly
- [ ] Test haptic feedback on physical device

---

## 📦 Where to Get Lottie Files

1. **[LottieFiles](https://lottiefiles.com/)** - Free and premium animations
2. **[Lordicon](https://lordicon.com/)** - Animated icons
3. **Custom** - Request from design team

### Recommended Animations
- ✅ `success.json` - Checkmark animation
- 🏆 `trophy.json` - Achievement celebration
- ⏳ `loading.json` - Loading spinner
- 📊 `empty-state.json` - Empty list state
- 🎯 `target.json` - Goal completion

---

## 🎨 Design Guidelines

### GlassCard
- Use for grouped content
- Maintain consistent padding (20-24px)
- Don't nest GlassCards

### Lottie Animations
- Keep files under 100KB
- Use 60fps for smooth playback
- Prefer `loop: false` for feedback
- Use `loop: true` for loading states

### Haptics
- Don't overuse - reserve for meaningful interactions
- Use `light()` for most buttons
- Use `success()`/`error()` for outcomes
- Test on physical device

---

## ✨ Benefits

**Visual:**
- Premium glassmorphism effect
- Smooth, professional animations
- Consistent design language

**UX:**
- Physical feedback enhances engagement
- Animations guide user attention
- Professional feel increases trust

**Developer Experience:**
- Simple, semantic APIs
- Type-safe components
- Easy migration path

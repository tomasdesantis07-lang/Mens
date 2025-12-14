# MENS Animations

This directory contains Lottie JSON animation files for the MENS app.

## Usage

Place your Lottie JSON files here and import them using the `MensLottie` component:

```tsx
import { MensLottie } from '@/components/common/MensLottie';

// Example usage
<MensLottie 
  source={require('./animations/success.json')}
  loop={false}
  autoPlay={true}
  style={{ width: 200, height: 200 }}
/>
```

## Recommended Animation Sources

- [LottieFiles](https://lottiefiles.com/) - Free and premium Lottie animations
- [Lordicon](https://lordicon.com/) - Animated icons
- Custom animations from design team

## Animation Guidelines

- Keep file sizes under 100KB when possible
- Use 60fps for smooth animations
- Optimize animations using LottieFiles tools
- Prefer loop: false for one-time feedback animations
- Use loop: true for loading states or ambient animations

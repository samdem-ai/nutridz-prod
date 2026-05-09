import { Stack } from 'expo-router';
import { OnboardingColors } from '../../src/constants/onboardingTheme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: OnboardingColors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="sex" />
      <Stack.Screen name="birth-year" />
      <Stack.Screen name="height" />
      <Stack.Screen name="current-weight" />
      <Stack.Screen name="target-weight" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="pace" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="loading" options={{ animation: 'fade' }} />
      <Stack.Screen name="plan-ready" options={{ animation: 'fade' }} />
    </Stack>
  );
}

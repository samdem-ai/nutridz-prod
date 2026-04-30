import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { Colors } from '../src/constants/colors';
import '../src/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
  },
});

const screenDefaults = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: '#FFFFFF',
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
};

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
    loadUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, ...screenDefaults }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="chat"
            options={{
              headerShown: true,
              title: 'Assistant NutriDz',
              ...screenDefaults,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Paramètres',
              ...screenDefaults,
            }}
          />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { Colors } from '../src/constants/colors';
import { scheduleNotificationsIfPermitted } from '../src/services/notifications';
import AiChatFab from '../src/components/ui/AiChatFab';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    loadSettings();
    loadUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Schedule smart notifications on auth (idempotent)
      scheduleNotificationsIfPermitted().catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, ...screenDefaults }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Paramètres',
              headerBackTitle: '',
              headerBackTitleVisible: false,
              ...screenDefaults,
            } as any}
          />
          <Stack.Screen name="achievements" options={{ headerShown: false }} />
          <Stack.Screen name="barcode" options={{ headerShown: false }} />
          <Stack.Screen name="meal-plan" options={{ headerShown: false }} />
          <Stack.Screen name="algerian-dishes" options={{ headerShown: false }} />
          <Stack.Screen name="create-recipe" options={{ headerShown: false }} />
          <Stack.Screen name="targets" options={{ headerShown: false }} />
          <Stack.Screen name="my-profile" options={{ headerShown: false }} />
          <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
        </Stack>
        {isAuthenticated && <AiChatFab />}
      </View>
    </QueryClientProvider>
  );
}

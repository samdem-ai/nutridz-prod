import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type SmartNotificationOptions = {
  enableMealReminders?: boolean;
  enableHydrationNudges?: boolean;
  enableStreakReminder?: boolean;
};

// Expo Go on Android no longer supports remote push, but local scheduled notifications
// still work. We only use local notifications, but we wrap everything in try/catch
// so the app never crashes if expo-notifications throws.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[notifications] setNotificationHandler failed:', e);
}

export async function requestPermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  } catch (e) {
    console.warn('[notifications] permission check failed:', e);
    return false;
  }
}

export async function cancelAllScheduled() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[notifications] cancelAll failed:', e);
  }
}

const dailyAt = (hour: number, minute = 0): Notifications.DailyTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour,
  minute,
});

async function safeSchedule(content: any, trigger: any) {
  try {
    await Notifications.scheduleNotificationAsync({ content, trigger });
  } catch (e) {
    console.warn('[notifications] schedule failed:', e);
  }
}

export async function scheduleSmartNotifications(opts: SmartNotificationOptions = {}) {
  const {
    enableMealReminders = true,
    enableHydrationNudges = true,
    enableStreakReminder = true,
  } = opts;

  await cancelAllScheduled();

  if (enableMealReminders) {
    await safeSchedule({ title: '🌅 Petit-déjeuner', body: 'Commence la journée avec un repas équilibré' }, dailyAt(8, 0));
    await safeSchedule({ title: '🍽️ Déjeuner', body: 'N\'oublie pas de logger ton repas dans NutriDz' }, dailyAt(13, 0));
    await safeSchedule({ title: '🌙 Dîner', body: 'Comment s\'est passée ta journée nutrition ?' }, dailyAt(20, 0));
  }

  if (enableHydrationNudges) {
    for (const h of [10, 14, 17]) {
      await safeSchedule({ title: '💧 Hydratation', body: 'Pense à boire un verre d\'eau (250ml)' }, dailyAt(h, 30));
    }
  }

  if (enableStreakReminder) {
    await safeSchedule({ title: '🔥 Ton streak', body: 'Logger ton repas pour garder ton streak intact !' }, dailyAt(21, 30));
  }
}

export async function scheduleNotificationsIfPermitted(opts?: SmartNotificationOptions) {
  // Skip on Android in Expo Go to avoid the SDK 53 push warning. Local notifications
  // technically still work but the warning is noisy. Users on a dev/standalone build
  // (executionEnvironment !== 'storeClient') get the full experience.
  if (Platform.OS === 'android' && isExpoGo) {
    console.log('[notifications] skipping on Android Expo Go (SDK 53 limitation). Use a dev build for full support.');
    return false;
  }
  try {
    const ok = await requestPermissionAsync();
    if (!ok) return false;
    await scheduleSmartNotifications(opts);
    return true;
  } catch (e) {
    console.warn('[notifications] scheduling failed:', e);
    return false;
  }
}

/** Fire a test notification 5 seconds from now. */
export async function sendTestNotification() {
  const ok = await requestPermissionAsync();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🥗 NutriDz Test',
      body: 'Les notifications fonctionnent ! Tu vas recevoir des rappels repas, eau et streak.',
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } as any,
  });
  return true;
}

export async function listScheduled() {
  return Notifications.getAllScheduledNotificationsAsync();
}

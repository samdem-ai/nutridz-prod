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

/**
 * Wipes + reschedules the full notification set:
 *   1. User's onboarding meal reminders (if any), else hardcoded fallback
 *   2. Hydration nudges (3×/day)
 *   3. Streak reminder
 *
 * Pass `userMealSlots` from `getEnabledReminders()` to honor user-chosen times.
 * Without slots: fallback to legacy 8/13/20 schedule.
 */
export async function scheduleSmartNotifications(
  opts: SmartNotificationOptions = {},
  userMealSlots?: Array<{ key: string; hour: number; minute: number; title: string; body: string }>
) {
  const {
    enableMealReminders = true,
    enableHydrationNudges = true,
    enableStreakReminder = true,
  } = opts;

  await cancelAllScheduled();

  if (enableMealReminders) {
    if (userMealSlots && userMealSlots.length > 0) {
      // Use user's chosen times
      for (const slot of userMealSlots) {
        await safeSchedule(
          { title: slot.title, body: slot.body, sound: 'default' },
          dailyAt(slot.hour, slot.minute)
        );
      }
    } else {
      // Legacy fallback for users who skipped onboarding reminder step
      await safeSchedule({ title: '🌅 Petit-déjeuner', body: 'Commence la journée avec un repas équilibré' }, dailyAt(8, 0));
      await safeSchedule({ title: '🍽️ Déjeuner', body: 'N\'oublie pas de logger ton repas dans NutriDz' }, dailyAt(13, 0));
      await safeSchedule({ title: '🌙 Dîner', body: 'Comment s\'est passée ta journée nutrition ?' }, dailyAt(20, 0));
    }
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

export async function scheduleNotificationsIfPermitted(
  opts?: SmartNotificationOptions,
  userMealSlots?: Array<{ key: string; hour: number; minute: number; title: string; body: string }>
) {
  if (Platform.OS === 'android' && isExpoGo) {
    console.log('[notifications] skipping on Android Expo Go (SDK 53 limitation). Use a dev build for full support.');
    return false;
  }
  try {
    const ok = await requestPermissionAsync();
    if (!ok) return false;
    await scheduleSmartNotifications(opts, userMealSlots);
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

/**
 * Schedule the full notification set using user's onboarding meal slots +
 * hydration + streak. Single source of truth — wipes prior schedule.
 */
export async function scheduleOnboardingReminders(
  slots: Array<{ key: string; hour: number; minute: number; title: string; body: string }>
): Promise<boolean> {
  return scheduleNotificationsIfPermitted({}, slots);
}

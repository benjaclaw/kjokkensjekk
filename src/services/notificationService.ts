import * as Notifications from "expo-notifications";
import type { Deviation } from "../types";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Cancel all scheduled notifications before re-scheduling
async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule daily temperature logging reminders.
 * Morning (07:00), midday (12:00), evening (18:00).
 */
export async function scheduleTemperatureReminders(): Promise<void> {
  const times = [
    { hour: 7, minute: 0, title: "Morgenlogg temperatur", body: "Tid for å logge morgentemperaturer for alle enheter." },
    { hour: 12, minute: 0, title: "Middagslogg temperatur", body: "Tid for å logge middagstemperaturer for alle enheter." },
    { hour: 18, minute: 0, title: "Kveldslogg temperatur", body: "Tid for å logge kveldstemperaturer for alle enheter." },
  ];

  for (const t of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.title,
        body: t.body,
        data: { type: "temperature_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
      },
    });
  }
}

/**
 * Schedule daily checklist reminders.
 * Opening (07:00) and closing (22:00).
 */
export async function scheduleChecklistReminders(): Promise<void> {
  const times = [
    { hour: 7, minute: 0, title: "Åpningssjekk", body: "Husk å fullføre åpningssjekklisten." },
    { hour: 22, minute: 0, title: "Stengesjekk", body: "Husk å fullføre stengesjekklisten før du går." },
  ];

  for (const t of times) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.title,
        body: t.body,
        data: { type: "checklist_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
      },
    });
  }
}

/**
 * Schedule reminders for deviations approaching their due date.
 * Triggers 24 hours before due date.
 */
export async function scheduleDeviationReminders(
  deviations: Deviation[],
): Promise<void> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const deviation of deviations) {
    if (
      deviation.status === "closed" ||
      !deviation.dueDate ||
      deviation.dueDate <= now
    ) {
      continue;
    }

    const reminderTime = deviation.dueDate - dayMs;
    if (reminderTime <= now) {
      // Due date is less than 24h away — notify now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Avvik nærmer seg frist",
          body: `"${deviation.description.slice(0, 60)}" har frist snart.`,
          data: { type: "deviation_reminder", deviationId: deviation.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });
    } else {
      const secondsUntil = Math.max(60, Math.floor((reminderTime - now) / 1000));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Avvik nærmer seg frist",
          body: `"${deviation.description.slice(0, 60)}" har frist i morgen.`,
          data: { type: "deviation_reminder", deviationId: deviation.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntil,
        },
      });
    }
  }
}

/**
 * Set up all recurring notifications.
 * Call this on app start after permissions are granted.
 */
export async function setupAllNotifications(
  deviations: Deviation[],
): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  await cancelAllScheduled();
  await Promise.all([
    scheduleTemperatureReminders(),
    scheduleChecklistReminders(),
    scheduleDeviationReminders(deviations),
  ]);
}

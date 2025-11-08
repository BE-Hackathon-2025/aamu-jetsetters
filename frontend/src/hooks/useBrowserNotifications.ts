import { useEffect, useRef } from 'react';
import { browserNotificationService } from '../services/browserNotifications';
import { notificationsApi } from '../services/notificationsApi';
import { preferencesApi } from '../services/preferencesApi';
import { firebaseAuthService } from '../services/firebaseAuth';

export function useBrowserNotifications(enabled: boolean = true) {
  const lastNotificationIdRef = useRef<number | null>(null);
  const preferencesRef = useRef<{ pushNotifications: boolean } | null>(null);

  useEffect(() => {
    if (!enabled || !browserNotificationService.isSupported()) {
      return;
    }

    const checkAndShowNotifications = async () => {
      try {
        const user = firebaseAuthService.getCurrentUser();
        if (!user?.uid) {
          return;
        }

        if (!preferencesRef.current) {
          const preferences = await preferencesApi.getPreferences(user.uid);
          preferencesRef.current = preferences;
        }

        if (!preferencesRef.current?.pushNotifications) {
          return;
        }

        if (browserNotificationService.getPermission() !== 'granted') {
          return;
        }

        const notifications = await notificationsApi.getAllNotifications(10);
        
        if (notifications.length === 0) {
          return;
        }

        const latestNotification = notifications[0];
        const lastId = lastNotificationIdRef.current;

        if (lastId === null) {
          lastNotificationIdRef.current = latestNotification.id;
          browserNotificationService.setLastNotificationId(latestNotification.id);
          return;
        }

        if (latestNotification.id > lastId && !latestNotification.read) {
          lastNotificationIdRef.current = latestNotification.id;
          browserNotificationService.setLastNotificationId(latestNotification.id);

          await browserNotificationService.showNotification(
            latestNotification.title,
            {
              body: latestNotification.message,
              tag: `water-quality-${latestNotification.id}`,
              onclick: () => {
                window.focus();
                const event = new CustomEvent('navigateToNotifications');
                window.dispatchEvent(event);
              },
            }
          );
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    const loadPreferences = async () => {
      const user = firebaseAuthService.getCurrentUser();
      if (user?.uid) {
        try {
          const preferences = await preferencesApi.getPreferences(user.uid);
          preferencesRef.current = preferences;
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    };

    loadPreferences();
    checkAndShowNotifications();

    const interval = setInterval(checkAndShowNotifications, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled]);
}


export type NotificationPermission = 'default' | 'granted' | 'denied';

export class BrowserNotificationService {
  private static instance: BrowserNotificationService;
  private permission: NotificationPermission = 'default';
  private lastNotificationId: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission as NotificationPermission;
    }
  }

  static getInstance(): BrowserNotificationService {
    if (!BrowserNotificationService.instance) {
      BrowserNotificationService.instance = new BrowserNotificationService();
    }
    return BrowserNotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission as NotificationPermission;
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission as NotificationPermission;
    }
    return this.permission;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async showNotification(
    title: string,
    options: NotificationOptions & { onclick?: () => void } = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    try {
      const { onclick, ...notificationOptions } = options;
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        ...notificationOptions,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        if (onclick) {
          onclick();
        }
      };

      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  setLastNotificationId(id: number): void {
    this.lastNotificationId = id;
  }

  getLastNotificationId(): number | null {
    return this.lastNotificationId;
  }
}

export const browserNotificationService = BrowserNotificationService.getInstance();


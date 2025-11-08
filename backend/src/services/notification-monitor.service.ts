import { waterDataService } from './water-data.service.js';
import { notificationsService } from './notifications.service.js';
import { emailService } from './email.service.js';

export class NotificationMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private demoCheckCount: number = 0;
  private criticalOnlyMode: boolean = false;

  startMonitoring(intervalMs: number = 60000, enableDemoChecks: boolean = false): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.demoCheckCount = 0;
    this.criticalOnlyMode = false;

    if (enableDemoChecks) {
      setTimeout(() => {
        this.checkAndNotify(false);
      }, 20000);

      setTimeout(() => {
        this.checkAndNotify(false);
      }, 40000);

      setTimeout(() => {
        this.criticalOnlyMode = true;
      }, 6 * 60 * 60 * 1000);
    }

    this.checkInterval = setInterval(() => {
      this.checkAndNotify(this.criticalOnlyMode);
    }, intervalMs);
  }

  getNotificationCount(): number {
    return this.demoCheckCount;
  }

  incrementNotificationCount(): void {
    this.demoCheckCount++;
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.isMonitoring = false;
    }
  }

  private async checkAndNotify(criticalOnly: boolean = false): Promise<void> {
    try {
      const riskIndex = waterDataService.getWaterRiskIndex();
      
      if (criticalOnly && riskIndex.level !== 'critical') {
        return;
      }
      
      const notification = notificationsService.checkAndCreateNotification(riskIndex.level);

      if (notification) {
        this.incrementNotificationCount();
        
        if (emailService.isEmailConfigured()) {
          await emailService.sendNotificationEmail(notification);
        }
      }
    } catch (error) {
      console.error('Error in notification monitor:', error);
    }
  }
}

export const notificationMonitorService = new NotificationMonitorService();


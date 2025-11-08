import nodemailer from 'nodemailer';
import type { Notification } from './notifications.service.js';
import { userPreferencesService } from './user-preferences.service.js';

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;
  private initialized: boolean = false;

  private ensureInitialized(): void {
    if (this.initialized) return;
    this.initializeTransporter();
    this.initialized = true;
  }

  private initializeTransporter(): void {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPass) {
      console.warn('Email service not configured: EMAIL_USER and EMAIL_PASSWORD environment variables not set');
      return;
    }

    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    };

    this.transporter = nodemailer.createTransport(config);
    this.isConfigured = true;
  }

  async sendNotificationEmail(notification: Notification): Promise<boolean> {
    this.ensureInitialized();
    
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured, skipping email notification');
      return false;
    }

    try {
      const userEmails = userPreferencesService.getUsersWithEmailEnabled();

      if (userEmails.length === 0) {
        return false;
      }

      const emailSubject = notification.title;
      const emailBody = this.formatEmailBody(notification);

      const mailOptions = {
        from: `"Water Safety System" <${process.env.EMAIL_USER}>`,
        to: userEmails.join(', '),
        subject: emailSubject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending notification email:', error);
      return false;
    }
  }

  private formatEmailBody(notification: Notification): string {
    const riskLevelColors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      moderate: '#f59e0b',
      low: '#eab308',
      stable: '#22c55e',
    };

    const color = riskLevelColors[notification.riskLevel] || '#6b7280';
    const timestamp = new Date(notification.createdAt).toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
            }
            .risk-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              color: white;
              font-weight: bold;
              background-color: ${color};
              margin: 10px 0;
            }
            .message {
              background: white;
              padding: 15px;
              border-left: 4px solid ${color};
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Water Safety Alert</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <div class="risk-badge">${notification.riskLevel.toUpperCase()}</div>
            <div class="message">
              <p>${notification.message}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Time:</strong> ${timestamp}
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              For more information, please visit your Water Safety Dashboard.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Water Safety System.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  isEmailConfigured(): boolean {
    this.ensureInitialized();
    return this.isConfigured;
  }
}

export const emailService = new EmailService();


import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserPreferences {
  id: number;
  userId: string;
  email: string;
  waterQualityAlerts: boolean;
  systemUpdates: boolean;
  maintenanceNotices: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatedAt: Date;
}

export interface PreferencesUpdate {
  waterQualityAlerts?: boolean;
  systemUpdates?: boolean;
  maintenanceNotices?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export class UserPreferencesService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/notifications.db');
    const dbDir = path.dirname(dbPath);
    mkdirSync(dbDir, { recursive: true });
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        waterQualityAlerts BOOLEAN NOT NULL DEFAULT 1,
        systemUpdates BOOLEAN NOT NULL DEFAULT 1,
        maintenanceNotices BOOLEAN NOT NULL DEFAULT 0,
        emailNotifications BOOLEAN NOT NULL DEFAULT 1,
        pushNotifications BOOLEAN NOT NULL DEFAULT 1,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_userId_prefs ON user_preferences(userId);
      CREATE INDEX IF NOT EXISTS idx_email_prefs ON user_preferences(email);
    `);
  }

  getPreferences(userId: string): UserPreferences | null {
    const stmt = this.db.prepare('SELECT * FROM user_preferences WHERE userId = ?');
    const row = stmt.get(userId) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToPreferences(row);
  }

  getPreferencesByEmail(email: string): UserPreferences | null {
    const stmt = this.db.prepare('SELECT * FROM user_preferences WHERE email = ?');
    const row = stmt.get(email) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToPreferences(row);
  }

  savePreferences(userId: string, email: string, preferences: PreferencesUpdate): UserPreferences {
    const existing = this.getPreferences(userId);

    if (existing) {
      const update = this.db.prepare(`
        UPDATE user_preferences
        SET 
          email = ?,
          waterQualityAlerts = COALESCE(?, waterQualityAlerts),
          systemUpdates = COALESCE(?, systemUpdates),
          maintenanceNotices = COALESCE(?, maintenanceNotices),
          emailNotifications = COALESCE(?, emailNotifications),
          pushNotifications = COALESCE(?, pushNotifications),
          updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `);

      update.run(
        email,
        preferences.waterQualityAlerts !== undefined ? (preferences.waterQualityAlerts ? 1 : 0) : null,
        preferences.systemUpdates !== undefined ? (preferences.systemUpdates ? 1 : 0) : null,
        preferences.maintenanceNotices !== undefined ? (preferences.maintenanceNotices ? 1 : 0) : null,
        preferences.emailNotifications !== undefined ? (preferences.emailNotifications ? 1 : 0) : null,
        preferences.pushNotifications !== undefined ? (preferences.pushNotifications ? 1 : 0) : null,
        userId
      );

      return this.getPreferences(userId)!;
    }

    const insert = this.db.prepare(`
      INSERT INTO user_preferences (
        userId, email, waterQualityAlerts, systemUpdates, 
        maintenanceNotices, emailNotifications, pushNotifications
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      userId,
      email,
      preferences.waterQualityAlerts !== undefined ? (preferences.waterQualityAlerts ? 1 : 0) : 1,
      preferences.systemUpdates !== undefined ? (preferences.systemUpdates ? 1 : 0) : 1,
      preferences.maintenanceNotices !== undefined ? (preferences.maintenanceNotices ? 1 : 0) : 0,
      preferences.emailNotifications !== undefined ? (preferences.emailNotifications ? 1 : 0) : 1,
      preferences.pushNotifications !== undefined ? (preferences.pushNotifications ? 1 : 0) : 1
    );

    return this.getPreferences(userId)!;
  }

  getUsersWithEmailEnabled(): string[] {
    const stmt = this.db.prepare('SELECT email FROM user_preferences WHERE emailNotifications = 1');
    const rows = stmt.all() as { email: string }[];
    return rows.map((row) => row.email);
  }

  getUsersWithWaterQualityAlertsEnabled(): string[] {
    const stmt = this.db.prepare('SELECT userId FROM user_preferences WHERE waterQualityAlerts = 1');
    const rows = stmt.all() as { userId: string }[];
    return rows.map((row) => row.userId);
  }

  private mapRowToPreferences(row: any): UserPreferences {
    return {
      id: row.id,
      userId: row.userId,
      email: row.email,
      waterQualityAlerts: row.waterQualityAlerts === 1,
      systemUpdates: row.systemUpdates === 1,
      maintenanceNotices: row.maintenanceNotices === 1,
      emailNotifications: row.emailNotifications === 1,
      pushNotifications: row.pushNotifications === 1,
      updatedAt: new Date(row.updatedAt),
    };
  }

  close(): void {
    this.db.close();
  }
}

export const userPreferencesService = new UserPreferencesService();


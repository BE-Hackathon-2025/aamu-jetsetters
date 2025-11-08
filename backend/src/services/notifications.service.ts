import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import type { OverallRiskLevel } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Notification {
  id: number;
  type: 'water-quality';
  title: string;
  message: string;
  riskLevel: OverallRiskLevel;
  previousRiskLevel: OverallRiskLevel | null;
  read: boolean;
  createdAt: Date;
}

export class NotificationsService {
  private db: Database.Database;
  private previousRiskLevel: OverallRiskLevel = 'stable';

  constructor() {
    const dbPath = path.join(__dirname, '../../data/notifications.db');
    const dbDir = path.dirname(dbPath);
    mkdirSync(dbDir, { recursive: true });
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL DEFAULT 'water-quality',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        riskLevel TEXT NOT NULL,
        previousRiskLevel TEXT,
        read BOOLEAN NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_createdAt ON notifications(createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_riskLevel ON notifications(riskLevel);
    `);
  }

  checkAndCreateNotification(currentRiskLevel: OverallRiskLevel): Notification | null {
    const shouldNotify = this.shouldCreateNotification(this.previousRiskLevel, currentRiskLevel);
    
    if (!shouldNotify) {
      this.previousRiskLevel = currentRiskLevel;
      return null;
    }

    const notification = this.createNotification(this.previousRiskLevel, currentRiskLevel);
    this.previousRiskLevel = currentRiskLevel;
    
    return notification;
  }

  private shouldCreateNotification(previous: OverallRiskLevel, current: OverallRiskLevel): boolean {
    if (previous === current) return false;

    if (current === 'critical') {
      return true;
    }

    const isRecoveringFromCritical = previous === 'critical';
    if (isRecoveringFromCritical) {
      return true;
    }

    if (current === 'stable' && previous !== 'stable') {
      return true;
    }

    return false;
  }

  private createNotification(previous: OverallRiskLevel, current: OverallRiskLevel): Notification {
    let title: string;
    let message: string;

    if (current === 'critical') {
      title = 'CRITICAL ALERT: Water Quality Emergency';
      message = 'Water quality has reached CRITICAL levels. DO NOT use water for drinking, cooking, or bathing. Seek alternative water sources immediately and follow guidance from local authorities.';
    } else if (previous === 'critical') {
      title = 'Water Quality Update: Conditions Improving';
      message = `Water quality has improved from CRITICAL to ${current.toUpperCase()}. While conditions are improving, please continue to follow safety guidelines. Current status: ${current.toUpperCase()}.`;
    } else if (current === 'stable') {
      title = 'Water Quality Restored';
      message = 'Water quality has returned to STABLE levels. Water is safe for all uses including drinking, cooking, and bathing. Continue normal usage.';
    } else {
      title = 'Water Quality Status Change';
      message = `Water quality status has changed from ${previous.toUpperCase()} to ${current.toUpperCase()}. Please review current safety guidelines.`;
    }

    const insert = this.db.prepare(`
      INSERT INTO notifications (type, title, message, riskLevel, previousRiskLevel, read)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    const result = insert.run(
      'water-quality',
      title,
      message,
      current,
      previous
    );

    return this.getNotificationById(result.lastInsertRowid as number);
  }

  getAllNotifications(limit: number = 50): Notification[] {
    const stmt = this.db.prepare(`
      SELECT * FROM notifications
      ORDER BY createdAt DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((row) => this.mapRowToNotification(row));
  }

  getUnreadNotifications(): Notification[] {
    const stmt = this.db.prepare(`
      SELECT * FROM notifications
      WHERE read = 0
      ORDER BY createdAt DESC
    `);

    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToNotification(row));
  }

  getUnreadCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  getNotificationById(id: number): Notification {
    const stmt = this.db.prepare('SELECT * FROM notifications WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      throw new Error(`Notification with id ${id} not found`);
    }

    return this.mapRowToNotification(row);
  }

  markAsRead(id: number): Notification {
    const update = this.db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE id = ?
    `);

    const result = update.run(id);

    if (result.changes === 0) {
      throw new Error(`Notification with id ${id} not found`);
    }

    return this.getNotificationById(id);
  }

  markAllAsRead(): number {
    const update = this.db.prepare(`
      UPDATE notifications
      SET read = 1
      WHERE read = 0
    `);

    return update.run().changes;
  }

  deleteNotification(id: number): boolean {
    const del = this.db.prepare('DELETE FROM notifications WHERE id = ?');
    const result = del.run(id);
    return result.changes > 0;
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      riskLevel: row.riskLevel,
      previousRiskLevel: row.previousRiskLevel,
      read: row.read === 1,
      createdAt: new Date(row.createdAt),
    };
  }

  close(): void {
    this.db.close();
  }
}

export const notificationsService = new NotificationsService();


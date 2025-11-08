import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserEmail {
  id: number;
  email: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEmailsService {
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
      CREATE TABLE IF NOT EXISTS user_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        userId TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_email ON user_emails(email);
      CREATE INDEX IF NOT EXISTS idx_userId ON user_emails(userId);
    `);
  }

  upsertUserEmail(email: string, userId: string): UserEmail {
    const existing = this.getUserByEmail(email);
    
    if (existing) {
      const update = this.db.prepare(`
        UPDATE user_emails
        SET userId = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `);
      update.run(userId, email);
      return this.getUserByEmail(email)!;
    }

    const insert = this.db.prepare(`
      INSERT INTO user_emails (email, userId)
      VALUES (?, ?)
    `);

    const result = insert.run(email, userId);
    return this.getUserById(result.lastInsertRowid as number);
  }

  getUserByEmail(email: string): UserEmail | null {
    const stmt = this.db.prepare('SELECT * FROM user_emails WHERE email = ?');
    const row = stmt.get(email) as any;

    if (!row) {
      return null;
    }

    return this.mapRowToUserEmail(row);
  }

  getUserById(id: number): UserEmail {
    const stmt = this.db.prepare('SELECT * FROM user_emails WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      throw new Error(`User with id ${id} not found`);
    }

    return this.mapRowToUserEmail(row);
  }

  getAllUserEmails(): string[] {
    const stmt = this.db.prepare('SELECT email FROM user_emails');
    const rows = stmt.all() as any[];
    return rows.map((row) => row.email);
  }

  private mapRowToUserEmail(row: any): UserEmail {
    return {
      id: row.id,
      email: row.email,
      userId: row.userId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  close(): void {
    this.db.close();
  }
}

export const userEmailsService = new UserEmailsService();


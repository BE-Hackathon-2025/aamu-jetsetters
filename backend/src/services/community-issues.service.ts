import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { CommunityIssue, IssueStatus, SubmitIssueRequest } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CommunityIssuesService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../data/issues.db');
    const dbDir = path.dirname(dbPath);
    mkdirSync(dbDir, { recursive: true });
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueType TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
        contactEmail TEXT,
        contactPhone TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'acknowledged', 'resolved')),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_status ON issues(status);
      CREATE INDEX IF NOT EXISTS idx_priority ON issues(priority);
      CREATE INDEX IF NOT EXISTS idx_createdAt ON issues(createdAt DESC);
    `);
  }

  submitIssue(issueData: SubmitIssueRequest): CommunityIssue {
    const insert = this.db.prepare(`
      INSERT INTO issues (issueType, description, location, priority, contactEmail, contactPhone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'new')
    `);

    const result = insert.run(
      issueData.issueType,
      issueData.description,
      issueData.location,
      issueData.priority,
      issueData.contactEmail || null,
      issueData.contactPhone || null
    );

    return this.getIssueById(result.lastInsertRowid as number);
  }

  getAllIssues(status?: IssueStatus, priority?: string): CommunityIssue[] {
    let query = 'SELECT * FROM issues';
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY 
      CASE priority
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
      END,
      createdAt DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((row) => this.mapRowToIssue(row));
  }

  getIssueById(id: number): CommunityIssue {
    const stmt = this.db.prepare('SELECT * FROM issues WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      throw new Error(`Issue with id ${id} not found`);
    }

    return this.mapRowToIssue(row);
  }

  updateIssueStatus(id: number, status: IssueStatus): CommunityIssue {
    const update = this.db.prepare(`
      UPDATE issues 
      SET status = ?, updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = update.run(status, id);

    if (result.changes === 0) {
      throw new Error(`Issue with id ${id} not found`);
    }

    return this.getIssueById(id);
  }

  getUnreadCount(): number {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'new'");
    const result = stmt.get() as { count: number };
    return result.count;
  }

  private mapRowToIssue(row: any): CommunityIssue {
    return {
      id: row.id,
      issueType: row.issueType,
      description: row.description,
      location: row.location,
      priority: row.priority,
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  close(): void {
    this.db.close();
  }
}

export const communityIssuesService = new CommunityIssuesService();


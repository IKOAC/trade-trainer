import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function getDb() {
  const db = await open({
    filename: path.join(process.cwd(), 'data', 'training', 'trainer.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenarioId TEXT,
      pattern TEXT,
      userAnswer TEXT,
      correct INTEGER,
      difficulty TEXT,
      module TEXT,
      responseMs INTEGER,
      score INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

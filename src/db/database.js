import { openDatabaseSync } from 'expo-sqlite';

let dbInstance;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = openDatabaseSync('movi.db');
  }

  return dbInstance;
};

const searchCacheTable = `CREATE TABLE IF NOT EXISTS search_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    results_json TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
 )`;

const favoritesTable = `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    poster_url TEXT,
    overview TEXT, -- guardamos campos extras para exibição offline completa
    release_date TEXT,
    rating INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
 )`;

const watchlistTable = `CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    poster_url TEXT,
    overview TEXT,
    release_date TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
 )`;

export const initDb = async () => {
  const db = getDb();

  await db.execAsync(searchCacheTable);
  await db.execAsync(favoritesTable);
  await db.execAsync(watchlistTable);
  // Garante compatibilidade com instalações antigas
  try {
    await db.execAsync(`ALTER TABLE favorites ADD COLUMN rating INTEGER DEFAULT 0`);
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error;
    }
  }
};

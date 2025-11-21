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

const searchHistoryTable = `CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term TEXT NOT NULL UNIQUE,
    last_used_at DATETIME DEFAULT (datetime('now','localtime'))
 )`;

const favoritesTable = `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    poster_url TEXT,
    overview TEXT, -- guardamos campos extras para exibicao offline completa
    release_date TEXT,
    rating INTEGER DEFAULT 0,
    comment TEXT DEFAULT '',
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

const watchedTable = `CREATE TABLE IF NOT EXISTS watched (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    poster_url TEXT,
    overview TEXT,
    release_date TEXT,
    genres TEXT,
    mood TEXT,
    journal_comment TEXT,
    watched_at DATETIME DEFAULT (datetime('now','localtime'))
 )`;

const recentlyViewedTable = `CREATE TABLE IF NOT EXISTS recently_viewed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    poster_url TEXT,
    overview TEXT,
    release_date TEXT,
    viewed_at DATETIME DEFAULT (datetime('now','localtime'))
 )`;

export const initDb = async () => {
  const db = getDb();

  await db.execAsync(searchCacheTable);
  await db.execAsync(searchHistoryTable);
  await db.execAsync(favoritesTable);
  await db.execAsync(watchlistTable);
  await db.execAsync(watchedTable);
  await db.execAsync(recentlyViewedTable);
  // Garante compatibilidade com instalacoes antigas
  try {
    await db.execAsync(`ALTER TABLE favorites ADD COLUMN rating INTEGER DEFAULT 0`);
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error;
    }
  }
  try {
    await db.execAsync(`ALTER TABLE favorites ADD COLUMN comment TEXT DEFAULT ''`);
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error;
    }
  }
  try {
    await db.execAsync(`ALTER TABLE watched ADD COLUMN genres TEXT`);
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error;
    }
  }
  try {
    await db.execAsync(`ALTER TABLE watched ADD COLUMN mood TEXT`);
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error;
    }
  }
  try {
    await db.execAsync(`ALTER TABLE watched ADD COLUMN journal_comment TEXT`);
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    if (!message.includes('duplicate column') && !message.includes('already exists')) {
      throw error;
    }
  }
};

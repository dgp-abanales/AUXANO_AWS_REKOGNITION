import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST?.trim();
const DB_USER = process.env.DB_USER?.trim();
const DB_PASSWORD = process.env.DB_PASSWORD?.trim();
const DB_NAME = process.env.DB_NAME?.trim();
const DB_PORT = Number(process.env.DB_PORT || 3306);

let pool = null;

function isDbConfigured() {
  return !!(DB_HOST && DB_USER && DB_NAME);
}

export function isDatabaseEnabled() {
  return isDbConfigured();
}

export async function initializeDatabase() {
  if (!isDbConfigured()) {
    throw new Error('Database is not configured. Set DB_HOST, DB_USER, and DB_NAME in backend/.env.');
  }

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      employeeId VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL,
      faceIds JSON NOT NULL,
      poses JSON NOT NULL,
      enrolledAt DATETIME NOT NULL
    )
  `);

  return { enabled: true };
}

export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

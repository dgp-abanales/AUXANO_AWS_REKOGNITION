import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDatabaseEnabled, query } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'data', 'images');

function ensureImageDir() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

export async function loadUsers() {
  if (!isDatabaseEnabled()) {
    throw new Error('Database storage is disabled. Set DB_HOST, DB_USER, and DB_NAME in backend/.env.');
  }
  const rows = await query('SELECT * FROM users');
  function safeParseArray(value) {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      // Try comma-separated fallback
      return trimmed.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
    }
  }

  return rows.map((user) => ({
    ...user,
    faceIds: safeParseArray(user.faceIds),
    poses: safeParseArray(user.poses),
  }));
}

export async function saveUser(user) {
  if (!isDatabaseEnabled()) {
    throw new Error('Database storage is disabled. Set DB_HOST, DB_USER, and DB_NAME in backend/.env.');
  }

  const parsedEnrolledAt = new Date(user.enrolledAt).toISOString().slice(0, 19).replace('T', ' ');
  const values = [
    user.id,
    user.fullName,
    user.employeeId,
    user.email,
    JSON.stringify(user.faceIds),
    JSON.stringify(user.poses),
    parsedEnrolledAt,
  ];
  await query(
    `REPLACE INTO users (id, fullName, employeeId, email, faceIds, poses, enrolledAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    values
  );
  return user;
}

export async function getUserByEmployeeId(employeeId) {
  if (!isDatabaseEnabled()) {
    throw new Error('Database storage is disabled. Set DB_HOST, DB_USER, and DB_NAME in backend/.env.');
  }

  const rows = await query('SELECT * FROM users WHERE employeeId = ? LIMIT 1', [employeeId]);
  if (!rows.length) return null;
  const user = rows[0];
  function safeParseArray(value) {
    if (!value && value !== 0) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      return trimmed.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
    }
  }

  return {
    ...user,
    faceIds: safeParseArray(user.faceIds),
    poses: safeParseArray(user.poses),
  };
}

export function saveImage(employeeId, pose, buffer) {
  ensureImageDir();
  const userDir = path.join(IMAGES_DIR, employeeId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const filename = `${pose}.jpg`;
  const filepath = path.join(userDir, filename);
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
}

export function loadUsers() {
  ensureDirs();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

export function saveUser(user) {
  ensureDirs();
  const users = loadUsers();

  const existing = users.findIndex((u) => u.employeeId === user.employeeId);
  if (existing >= 0) {
    users[existing] = user;
  } else {
    users.push(user);
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  return user;
}

export function getUserByEmployeeId(employeeId) {
  return loadUsers().find((u) => u.employeeId === employeeId);
}

export function saveImage(employeeId, pose, buffer) {
  ensureDirs();
  const userDir = path.join(IMAGES_DIR, employeeId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const filename = `${pose}.jpg`;
  const filepath = path.join(userDir, filename);
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

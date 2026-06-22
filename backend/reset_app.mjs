import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import {
  RekognitionClient,
  CreateCollectionCommand,
  DeleteCollectionCommand,
} from '@aws-sdk/client-rekognition';

const DB_HOST = process.env.DB_HOST?.trim();
const DB_USER = process.env.DB_USER?.trim();
const DB_PASSWORD = process.env.DB_PASSWORD?.trim();
const DB_NAME = process.env.DB_NAME?.trim();
const DB_PORT = Number(process.env.DB_PORT || 3306);
const COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || 'auxano-faces';
const DATA_DIR = path.join(new URL('.', import.meta.url).pathname, '..', 'data');
const MOCK_FACES_FILE = path.join(DATA_DIR, 'mock-faces.json');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

async function resetDatabase() {
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.log('Database is not configured. Skipping DB reset.');
    return;
  }
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
  });
  await conn.execute('TRUNCATE TABLE users');
  console.log('Truncated users table in database:', DB_NAME);
  await conn.end();
}

async function resetRekognition() {
  const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKey || !secretKey) {
    console.log('AWS credentials not configured. Skipping Rekognition reset.');
    return;
  }

  const client = new RekognitionClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  try {
    await client.send(new DeleteCollectionCommand({ CollectionId: COLLECTION_ID }));
    console.log('Deleted Rekognition collection:', COLLECTION_ID);
  } catch (err) {
    console.warn('Could not delete collection (it may not exist):', err.name || err.message);
  }

  try {
    await client.send(new CreateCollectionCommand({ CollectionId: COLLECTION_ID }));
    console.log('Re-created Rekognition collection:', COLLECTION_ID);
  } catch (err) {
    console.error('Failed to create Rekognition collection:', err.message || err);
    throw err;
  }
}

function removeMockData() {
  if (fs.existsSync(MOCK_FACES_FILE)) {
    fs.writeFileSync(MOCK_FACES_FILE, '[]', 'utf-8');
    console.log('Cleared mock Rekognition face store:', MOCK_FACES_FILE);
  }
  if (fs.existsSync(IMAGES_DIR)) {
    for (const entry of fs.readdirSync(IMAGES_DIR)) {
      const full = path.join(IMAGES_DIR, entry);
      fs.rmSync(full, { recursive: true, force: true });
    }
    console.log('Cleared image folders in:', IMAGES_DIR);
  }
}

(async () => {
  try {
    await resetDatabase();
  } catch (err) {
    console.error('DB reset failed:', err.message || err);
  }
  removeMockData();
  try {
    await resetRekognition();
  } catch (err) {
    console.error('Rekognition reset failed:', err.message || err);
  }
  console.log('App reset complete. Start the backend and frontend again.');
})();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const MOCK_FACES_FILE = path.join(DATA_DIR, 'mock-faces.json');

const MOCK_METRICS = {
  confidence: 99.5,
  sharpness: 75,
  brightness: 55,
  yaw: 0,
  pitch: 0,
  roll: 0,
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MOCK_FACES_FILE)) fs.writeFileSync(MOCK_FACES_FILE, JSON.stringify([]), 'utf-8');
}

function loadMockFaces() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(MOCK_FACES_FILE, 'utf-8'));
}

function saveMockFaces(faces) {
  ensureDataFile();
  fs.writeFileSync(MOCK_FACES_FILE, JSON.stringify(faces, null, 2), 'utf-8');
}

function hashImage(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function ensureCollection() {
  console.log('[DEV MODE] Skipping AWS Rekognition collection setup');
}

export async function detectAndValidate(imageBuffer, pose = 'front') {
  if (!imageBuffer || imageBuffer.length < 1024) {
    return {
      valid: false,
      errors: ['Image is too small or empty. Capture a clear photo.'],
      metrics: MOCK_METRICS,
    };
  }

  const metrics = {
    ...MOCK_METRICS,
    yaw: pose === 'left' ? -25 : pose === 'right' ? 25 : 0,
  };

  return {
    valid: true,
    errors: [],
    metrics,
    faceDetails: [{ Confidence: 99.5, Quality: { Sharpness: 75, Brightness: 55 } }],
  };
}

export async function indexFace(imageBuffer, externalImageId) {
  const faces = loadMockFaces();
  const imageHash = hashImage(imageBuffer);
  const existing = faces.find((face) => face.hash === imageHash);

  if (existing) {
    return {
      Face: {
        FaceId: existing.faceId,
        ExternalImageId: existing.externalImageId,
      },
    };
  }

  const faceId = `mock-${uuidv4()}`;
  const faceRecord = {
    faceId,
    externalImageId,
    hash: imageHash,
    createdAt: new Date().toISOString(),
  };
  faces.push(faceRecord);
  saveMockFaces(faces);

  return {
    Face: { FaceId: faceId, ExternalImageId: externalImageId },
  };
}

export async function searchFace(imageBuffer) {
  const faces = loadMockFaces();
  const imageHash = hashImage(imageBuffer);
  const match = faces.find((face) => face.hash === imageHash);
  if (!match) return null;
  return {
    Face: {
      FaceId: match.faceId,
      ExternalImageId: match.externalImageId,
    },
    Similarity: 99.9,
  };
}

export async function listEnrolledFaces() {
  const faces = loadMockFaces();
  return faces.map((face) => ({
    FaceId: face.faceId,
    ExternalImageId: face.externalImageId,
  }));
}

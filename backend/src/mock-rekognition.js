import { v4 as uuidv4 } from 'uuid';

const MOCK_METRICS = {
  confidence: 99.5,
  sharpness: 75,
  brightness: 55,
  yaw: 0,
  pitch: 0,
  roll: 0,
};

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

export async function indexFace(_imageBuffer, externalImageId) {
  return {
    Face: { FaceId: `mock-${uuidv4()}`, ExternalImageId: externalImageId },
  };
}

export async function searchFace(_imageBuffer) {
  return null;
}

export async function listEnrolledFaces() {
  return [];
}

import {
  RekognitionClient,
  CreateCollectionCommand,
  IndexFacesCommand,
  DetectFacesCommand,
  SearchFacesByImageCommand,
  ListFacesCommand,
} from '@aws-sdk/client-rekognition';
import { isAwsConfigured } from './config.js';
import * as mock from './mock-rekognition.js';

let useMock = false;
let client = null;

const COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || 'auxano-faces';

const MIN_FACE_CONFIDENCE = 90;
const MIN_SHARPNESS = 40;
const MIN_BRIGHTNESS = 20;
const MAX_BRIGHTNESS = 95;

function getClient() {
  if (!client) {
    client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export function isUsingMock() {
  return useMock;
}

export async function initializeRekognition() {
  if (!isAwsConfigured()) {
    useMock = true;
    console.warn('[DEV MODE] AWS credentials not configured — using mock face validation');
    console.warn('           Set real credentials in backend/.env for production use');
    await mock.ensureCollection();
    return { mode: 'mock', reason: 'credentials_not_configured' };
  }

  try {
    await getClient().send(
      new CreateCollectionCommand({ CollectionId: COLLECTION_ID })
    );
    console.log(`Created Rekognition collection: ${COLLECTION_ID}`);
  } catch (err) {
    if (err.name === 'ResourceAlreadyExistsException') {
      useMock = false;
      return { mode: 'aws' };
    }

    useMock = true;
    console.warn(`[DEV MODE] AWS Rekognition unavailable: ${err.message}`);
    console.warn('           Server will run with mock validation. Fix backend/.env to use real AWS.');
    await mock.ensureCollection();
    return { mode: 'mock', reason: err.message };
  }

  useMock = false;
  return { mode: 'aws' };
}

export function validateFaceDetection(faceDetails) {
  const errors = [];

  if (!faceDetails || faceDetails.length === 0) {
    return { valid: false, errors: ['No face detected in image'] };
  }

  if (faceDetails.length > 1) {
    return { valid: false, errors: ['Multiple faces detected. Only one face per image is allowed'] };
  }

  const face = faceDetails[0];
  const confidence = face.Confidence ?? 0;

  if (confidence < MIN_FACE_CONFIDENCE) {
    errors.push(`Face confidence too low (${confidence.toFixed(1)}%). Minimum: ${MIN_FACE_CONFIDENCE}%`);
  }

  const quality = face.Quality || {};
  const sharpness = quality.Sharpness ?? 0;
  const brightness = quality.Brightness ?? 0;

  if (sharpness < MIN_SHARPNESS) {
    errors.push(`Image is too blurry (sharpness: ${sharpness.toFixed(1)}). Hold still and ensure good lighting`);
  }

  if (brightness < MIN_BRIGHTNESS) {
    errors.push(`Image is too dark (brightness: ${brightness.toFixed(1)}). Improve lighting`);
  }

  if (brightness > MAX_BRIGHTNESS) {
    errors.push(`Image is overexposed (brightness: ${brightness.toFixed(1)}). Reduce direct light`);
  }

  const pose = face.Pose || {};
  const yaw = Math.abs(pose.Yaw ?? 0);
  const pitch = Math.abs(pose.Pitch ?? 0);
  const roll = Math.abs(pose.Roll ?? 0);

  if (yaw > 45 || pitch > 30 || roll > 25) {
    errors.push('Face angle is too extreme. Look more directly at the camera');
  }

  return {
    valid: errors.length === 0,
    errors,
    metrics: {
      confidence,
      sharpness,
      brightness,
      yaw: pose.Yaw ?? 0,
      pitch: pose.Pitch ?? 0,
      roll: pose.Roll ?? 0,
    },
  };
}

export async function detectAndValidate(imageBuffer, pose) {
  if (useMock) {
    return mock.detectAndValidate(imageBuffer, pose);
  }

  const result = await getClient().send(
    new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ['ALL'],
    })
  );

  const validation = validateFaceDetection(result.FaceDetails);
  return { ...validation, faceDetails: result.FaceDetails };
}

export async function indexFace(imageBuffer, externalImageId) {
  if (useMock) {
    return mock.indexFace(imageBuffer, externalImageId);
  }

  const result = await getClient().send(
    new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      ExternalImageId: externalImageId,
      DetectionAttributes: ['ALL'],
      MaxFaces: 1,
      QualityFilter: 'AUTO',
    })
  );

  if (!result.FaceRecords || result.FaceRecords.length === 0) {
    const reasons = result.UnindexedFaces?.[0]?.Reasons || ['Unknown'];
    throw new Error(`Failed to index face: ${reasons.join(', ')}`);
  }

  return result.FaceRecords[0];
}

export async function searchFace(imageBuffer) {
  if (useMock) {
    return mock.searchFace(imageBuffer);
  }

  const result = await getClient().send(
    new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBuffer },
      MaxFaces: 1,
      FaceMatchThreshold: 85,
    })
  );

  return result.FaceMatches?.[0] || null;
}

export async function listEnrolledFaces() {
  if (useMock) {
    return mock.listEnrolledFaces();
  }

  const result = await getClient().send(
    new ListFacesCommand({
      CollectionId: COLLECTION_ID,
      MaxResults: 100,
    })
  );

  return result.Faces || [];
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {
  initializeRekognition,
  isUsingMock,
  detectAndValidate,
  indexFace,
  searchFace,
} from './rekognition.js';
import { saveUser, getUserByEmployeeId, saveImage, loadUsers } from './storage.js';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

const POSES = ['front', 'left', 'right'];

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Auxano Facial Recognition',
    mode: isUsingMock() ? 'dev-mock' : 'aws',
  });
});

app.post('/api/validate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ valid: false, errors: ['No image provided'] });
    }

    const pose = req.body.pose || 'front';
    if (!POSES.includes(pose)) {
      return res.status(400).json({ valid: false, errors: ['Invalid pose. Use: front, left, or right'] });
    }

    const result = await detectAndValidate(req.file.buffer, pose);

    if (!isUsingMock() && result.valid && pose !== 'front') {
      const yaw = result.metrics?.yaw ?? 0;
      if (pose === 'left' && yaw > -10) {
        result.valid = false;
        result.errors.push('Turn your head more to the left for the left profile photo');
      }
      if (pose === 'right' && yaw < 10) {
        result.valid = false;
        result.errors.push('Turn your head more to the right for the right profile photo');
      }
    }

    res.json({
      valid: result.valid,
      errors: result.errors,
      metrics: result.metrics,
      pose,
    });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ valid: false, errors: [err.message || 'Validation failed'] });
  }
});

app.post('/api/enroll', upload.array('images', 3), async (req, res) => {
  try {
    const { fullName, employeeId, email } = req.body;

    const fieldErrors = [];
    if (!fullName?.trim()) fieldErrors.push('Full name is required');
    if (!employeeId?.trim()) fieldErrors.push('Employee ID is required');
    if (!email?.trim()) fieldErrors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.push('Invalid email format');

    if (fieldErrors.length > 0) {
      return res.status(400).json({ success: false, errors: fieldErrors });
    }

    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({
        success: false,
        errors: ['Exactly 3 images are required (front, left, right)'],
      });
    }

    const existing = getUserByEmployeeId(employeeId.trim());
    if (existing) {
      return res.status(409).json({
        success: false,
        errors: [`Employee ID "${employeeId}" is already enrolled`],
      });
    }

    const poses = req.body.poses
      ? JSON.parse(req.body.poses)
      : ['front', 'left', 'right'];

    const validationResults = [];
    for (let i = 0; i < req.files.length; i++) {
      const result = await detectAndValidate(req.files[i].buffer, poses[i]);
      validationResults.push({ pose: poses[i], ...result });

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          errors: result.errors.map((e) => `[${poses[i]}] ${e}`),
          validationResults,
        });
      }
    }

    const faceIds = [];
    const externalId = `${employeeId.trim()}_${uuidv4().slice(0, 8)}`;

    for (let i = 0; i < req.files.length; i++) {
      const pose = poses[i];
      const imageId = `${externalId}_${pose}`;
      const record = await indexFace(req.files[i].buffer, imageId);
      faceIds.push(record.Face?.FaceId);
      saveImage(employeeId.trim(), pose, req.files[i].buffer);
    }

    const user = saveUser({
      id: uuidv4(),
      fullName: fullName.trim(),
      employeeId: employeeId.trim(),
      email: email.trim(),
      faceIds,
      enrolledAt: new Date().toISOString(),
      poses,
    });

    res.status(201).json({
      success: true,
      message: 'Face enrollment successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        enrolledAt: user.enrolledAt,
      },
      validationResults,
    });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ success: false, errors: [err.message || 'Enrollment failed'] });
  }
});

app.post('/api/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ matched: false, errors: ['No image provided'] });
    }

    const validation = await detectAndValidate(req.file.buffer, 'front');
    if (!validation.valid) {
      return res.status(400).json({ matched: false, errors: validation.errors });
    }

    const match = await searchFace(req.file.buffer);

    if (!match) {
      return res.json({
        matched: false,
        message: 'No matching face found in the system',
      });
    }

    const externalId = match.Face?.ExternalImageId || '';
    const employeeId = externalId.split('_')[0];
    const user = getUserByEmployeeId(employeeId);
    const similarity = match.Similarity ?? 0;

    res.json({
      matched: similarity >= 85,
      similarity: similarity.toFixed(2),
      user: user
        ? { fullName: user.fullName, employeeId: user.employeeId, email: user.email }
        : { employeeId },
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ matched: false, errors: [err.message || 'Verification failed'] });
  }
});

app.get('/api/users', (_req, res) => {
  const users = loadUsers().map(({ id, fullName, employeeId, email, enrolledAt }) => ({
    id,
    fullName,
    employeeId,
    email,
    enrolledAt,
  }));
  res.json(users);
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, errors: [err.message] });
  }
  res.status(500).json({ success: false, errors: [err.message] });
});

const PORT = process.env.PORT || 3001;

initializeRekognition().then(({ mode }) => {
  app.listen(PORT, () => {
    console.log(`Auxano Facial Recognition API running on http://localhost:${PORT}`);
    if (mode === 'mock') {
      console.log('Running in DEV MODE — add real AWS credentials to backend/.env for live Rekognition');
    }
  });
});
